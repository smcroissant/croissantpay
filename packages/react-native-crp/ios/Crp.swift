import Foundation
import StoreKit

@objc(CroissantPay)
class CroissantPay: NSObject {
    
    private var apiKey: String = ""
    private var apiUrl: String = ""
    private var debugLogs: Bool = false
    
    @objc
    func configure(_ apiKey: String, apiUrl: String, debugLogs: Bool, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        self.apiKey = apiKey
        self.apiUrl = apiUrl
        self.debugLogs = debugLogs
        
        log("Configured with API URL: \(apiUrl)")
        resolve(nil)
    }
    
    @objc
    func getProducts(_ productIds: [String], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                if #available(iOS 15.0, *) {
                    let products = try await Product.products(for: Set(productIds))
                    let result = products.map { product -> [String: Any] in
                        return [
                            "identifier": product.id,
                            "storeProductId": product.id,
                            "displayName": product.displayName,
                            "description": product.description,
                            "price": product.price.description,
                            "priceString": product.displayPrice,
                            "currencyCode": product.priceFormatStyle.currencyCode ?? "USD",
                            "type": self.mapProductType(product.type)
                        ]
                    }
                    resolve(result)
                } else {
                    // Fallback for older iOS versions
                    reject("E_UNSUPPORTED", "StoreKit 2 requires iOS 15+", nil)
                }
            } catch {
                log("Error fetching products: \(error)")
                reject("E_PRODUCTS_FAILED", error.localizedDescription, error)
            }
        }
    }
    
    @objc
    func purchase(_ productId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                if #available(iOS 15.0, *) {
                    guard let product = try await Product.products(for: [productId]).first else {
                        reject("E_PRODUCT_NOT_FOUND", "Product not found", nil)
                        return
                    }
                    
                    let result = try await product.purchase()
                    
                    switch result {
                    case .success(let verification):
                        switch verification {
                        case .verified(let transaction):
                            // Get the JWS representation for server validation
                            let jwsRepresentation = verification.jwsRepresentation
                            
                            resolve([
                                "transactionId": String(transaction.id),
                                "receiptData": jwsRepresentation ?? "",
                                "productId": transaction.productID,
                                "originalTransactionId": String(transaction.originalID)
                            ])
                            
                        case .unverified(_, let error):
                            reject("E_VERIFICATION_FAILED", "Transaction verification failed", error)
                        }
                        
                    case .userCancelled:
                        reject("E_USER_CANCELLED", "Purchase was cancelled", nil)
                        
                    case .pending:
                        reject("E_PURCHASE_PENDING", "Purchase is pending approval", nil)
                        
                    @unknown default:
                        reject("E_UNKNOWN", "Unknown purchase result", nil)
                    }
                } else {
                    reject("E_UNSUPPORTED", "StoreKit 2 requires iOS 15+", nil)
                }
            } catch {
                log("Purchase error: \(error)")
                reject("E_PURCHASE_FAILED", error.localizedDescription, error)
            }
        }
    }
    
    @objc
    func restorePurchases(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                if #available(iOS 15.0, *) {
                    var transactions: [[String: Any]] = []
                    
                    for await result in Transaction.currentEntitlements {
                        switch result {
                        case .verified(let transaction):
                            transactions.append([
                                "transactionId": String(transaction.id),
                                "receiptData": result.jwsRepresentation ?? "",
                                "productId": transaction.productID,
                                "originalTransactionId": String(transaction.originalID)
                            ])
                        case .unverified:
                            continue
                        }
                    }
                    
                    resolve(["transactions": transactions])
                } else {
                    reject("E_UNSUPPORTED", "StoreKit 2 requires iOS 15+", nil)
                }
            } catch {
                log("Restore error: \(error)")
                reject("E_RESTORE_FAILED", error.localizedDescription, error)
            }
        }
    }
    
    @objc
    func finishTransaction(_ transactionId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Task {
            if #available(iOS 15.0, *) {
                guard let id = UInt64(transactionId) else {
                    reject("E_INVALID_ID", "Invalid transaction ID", nil)
                    return
                }
                
                // Find and finish the transaction
                for await result in Transaction.unfinished {
                    if case .verified(let transaction) = result, transaction.id == id {
                        await transaction.finish()
                        resolve(nil)
                        return
                    }
                }
                
                // Transaction not found, but that's okay - it might already be finished
                resolve(nil)
            } else {
                reject("E_UNSUPPORTED", "StoreKit 2 requires iOS 15+", nil)
            }
        }
    }
    
    // MARK: - Helpers
    
    private func log(_ message: String) {
        if debugLogs {
            print("[CroissantPay] \(message)")
        }
    }
    
    @available(iOS 15.0, *)
    private func mapProductType(_ type: Product.ProductType) -> String {
        switch type {
        case .consumable:
            return "consumable"
        case .nonConsumable:
            return "non_consumable"
        case .autoRenewable:
            return "auto_renewable_subscription"
        case .nonRenewable:
            return "non_renewing_subscription"
        @unknown default:
            return "unknown"
        }
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}

