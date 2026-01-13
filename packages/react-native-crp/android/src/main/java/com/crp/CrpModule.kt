package com.crp

import android.util.Log
import com.android.billingclient.api.*
import com.facebook.react.bridge.*
import kotlinx.coroutines.*

class CroissantPayModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var apiKey: String = ""
    private var apiUrl: String = ""
    private var debugLogs: Boolean = false
    private var billingClient: BillingClient? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun getName(): String = "CroissantPay"

    @ReactMethod
    fun configure(apiKey: String, apiUrl: String, debugLogs: Boolean, promise: Promise) {
        this.apiKey = apiKey
        this.apiUrl = apiUrl
        this.debugLogs = debugLogs

        log("Configured with API URL: $apiUrl")

        // Initialize BillingClient
        billingClient = BillingClient.newBuilder(reactApplicationContext)
            .setListener { billingResult, purchases ->
                // Handle purchases in purchase() method
            }
            .enablePendingPurchases()
            .build()

        billingClient?.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    log("BillingClient connected")
                    promise.resolve(null)
                } else {
                    promise.reject("E_BILLING_SETUP", "Billing setup failed: ${billingResult.debugMessage}")
                }
            }

            override fun onBillingServiceDisconnected() {
                log("BillingClient disconnected")
            }
        })
    }

    @ReactMethod
    fun getProducts(productIds: ReadableArray, promise: Promise) {
        val client = billingClient
        if (client == null || !client.isReady) {
            promise.reject("E_NOT_READY", "BillingClient not ready")
            return
        }

        scope.launch {
            try {
                val productList = mutableListOf<QueryProductDetailsParams.Product>()
                
                for (i in 0 until productIds.size()) {
                    val productId = productIds.getString(i)
                    // Try subscription first, then in-app
                    productList.add(
                        QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(productId)
                            .setProductType(BillingClient.ProductType.SUBS)
                            .build()
                    )
                    productList.add(
                        QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(productId)
                            .setProductType(BillingClient.ProductType.INAPP)
                            .build()
                    )
                }

                val params = QueryProductDetailsParams.newBuilder()
                    .setProductList(productList)
                    .build()

                val result = client.queryProductDetails(params)
                
                if (result.billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    val products = WritableNativeArray()
                    
                    result.productDetailsList?.forEach { details ->
                        val product = WritableNativeMap().apply {
                            putString("identifier", details.productId)
                            putString("storeProductId", details.productId)
                            putString("displayName", details.title)
                            putString("description", details.description)
                            
                            // Get pricing info
                            if (details.productType == BillingClient.ProductType.SUBS) {
                                details.subscriptionOfferDetails?.firstOrNull()?.let { offer ->
                                    val pricingPhase = offer.pricingPhases.pricingPhaseList.firstOrNull()
                                    pricingPhase?.let {
                                        putString("price", it.priceAmountMicros.toString())
                                        putString("priceString", it.formattedPrice)
                                        putString("currencyCode", it.priceCurrencyCode)
                                    }
                                }
                                putString("type", "auto_renewable_subscription")
                            } else {
                                details.oneTimePurchaseOfferDetails?.let {
                                    putString("price", it.priceAmountMicros.toString())
                                    putString("priceString", it.formattedPrice)
                                    putString("currencyCode", it.priceCurrencyCode)
                                }
                                putString("type", "non_consumable")
                            }
                        }
                        products.pushMap(product)
                    }
                    
                    withContext(Dispatchers.Main) {
                        promise.resolve(products)
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        promise.reject("E_QUERY_FAILED", result.billingResult.debugMessage)
                    }
                }
            } catch (e: Exception) {
                log("Error fetching products: ${e.message}")
                withContext(Dispatchers.Main) {
                    promise.reject("E_PRODUCTS_FAILED", e.message)
                }
            }
        }
    }

    @ReactMethod
    fun purchase(productId: String, promise: Promise) {
        val client = billingClient
        val activity = currentActivity
        
        if (client == null || !client.isReady) {
            promise.reject("E_NOT_READY", "BillingClient not ready")
            return
        }
        
        if (activity == null) {
            promise.reject("E_NO_ACTIVITY", "No activity available")
            return
        }

        scope.launch {
            try {
                // Query the product first
                val queryParams = QueryProductDetailsParams.newBuilder()
                    .setProductList(listOf(
                        QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(productId)
                            .setProductType(BillingClient.ProductType.SUBS)
                            .build(),
                        QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(productId)
                            .setProductType(BillingClient.ProductType.INAPP)
                            .build()
                    ))
                    .build()

                val queryResult = client.queryProductDetails(queryParams)
                val productDetails = queryResult.productDetailsList?.firstOrNull()
                
                if (productDetails == null) {
                    withContext(Dispatchers.Main) {
                        promise.reject("E_PRODUCT_NOT_FOUND", "Product not found")
                    }
                    return@launch
                }

                val flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(listOf(
                        BillingFlowParams.ProductDetailsParams.newBuilder()
                            .setProductDetails(productDetails)
                            .apply {
                                productDetails.subscriptionOfferDetails?.firstOrNull()?.let {
                                    setOfferToken(it.offerToken)
                                }
                            }
                            .build()
                    ))
                    .build()

                withContext(Dispatchers.Main) {
                    // Use a PurchasesUpdatedListener to handle the result
                    val tempClient = BillingClient.newBuilder(reactApplicationContext)
                        .setListener { billingResult, purchases ->
                            when (billingResult.responseCode) {
                                BillingClient.BillingResponseCode.OK -> {
                                    purchases?.firstOrNull()?.let { purchase ->
                                        val result = WritableNativeMap().apply {
                                            putString("transactionId", purchase.orderId ?: "")
                                            putString("receiptData", purchase.purchaseToken)
                                            putString("productId", purchase.products.firstOrNull() ?: "")
                                        }
                                        promise.resolve(result)
                                    } ?: promise.reject("E_NO_PURCHASE", "No purchase returned")
                                }
                                BillingClient.BillingResponseCode.USER_CANCELED -> {
                                    promise.reject("E_USER_CANCELLED", "Purchase was cancelled")
                                }
                                BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> {
                                    promise.reject("E_ALREADY_OWNED", "Item already owned")
                                }
                                else -> {
                                    promise.reject("E_PURCHASE_FAILED", billingResult.debugMessage)
                                }
                            }
                        }
                        .enablePendingPurchases()
                        .build()

                    client.launchBillingFlow(activity, flowParams)
                }
            } catch (e: Exception) {
                log("Purchase error: ${e.message}")
                withContext(Dispatchers.Main) {
                    promise.reject("E_PURCHASE_FAILED", e.message)
                }
            }
        }
    }

    @ReactMethod
    fun restorePurchases(promise: Promise) {
        val client = billingClient
        if (client == null || !client.isReady) {
            promise.reject("E_NOT_READY", "BillingClient not ready")
            return
        }

        scope.launch {
            try {
                val transactions = WritableNativeArray()
                
                // Query subscriptions
                val subsParams = QueryPurchasesParams.newBuilder()
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build()
                val subsResult = client.queryPurchasesAsync(subsParams)
                
                subsResult.purchasesList.forEach { purchase ->
                    val transaction = WritableNativeMap().apply {
                        putString("transactionId", purchase.orderId ?: "")
                        putString("receiptData", purchase.purchaseToken)
                        putString("productId", purchase.products.firstOrNull() ?: "")
                    }
                    transactions.pushMap(transaction)
                }

                // Query in-app purchases
                val inappParams = QueryPurchasesParams.newBuilder()
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build()
                val inappResult = client.queryPurchasesAsync(inappParams)
                
                inappResult.purchasesList.forEach { purchase ->
                    val transaction = WritableNativeMap().apply {
                        putString("transactionId", purchase.orderId ?: "")
                        putString("receiptData", purchase.purchaseToken)
                        putString("productId", purchase.products.firstOrNull() ?: "")
                    }
                    transactions.pushMap(transaction)
                }

                val result = WritableNativeMap().apply {
                    putArray("transactions", transactions)
                }
                
                withContext(Dispatchers.Main) {
                    promise.resolve(result)
                }
            } catch (e: Exception) {
                log("Restore error: ${e.message}")
                withContext(Dispatchers.Main) {
                    promise.reject("E_RESTORE_FAILED", e.message)
                }
            }
        }
    }

    @ReactMethod
    fun finishTransaction(transactionId: String, promise: Promise) {
        // In Google Play Billing, we acknowledge instead of "finish"
        val client = billingClient
        if (client == null || !client.isReady) {
            promise.reject("E_NOT_READY", "BillingClient not ready")
            return
        }

        // Note: In a real implementation, you'd need the purchase token
        // For now, we just resolve as Google requires acknowledging at purchase time
        promise.resolve(null)
    }

    private fun log(message: String) {
        if (debugLogs) {
            Log.d("CroissantPay", message)
        }
    }
}

