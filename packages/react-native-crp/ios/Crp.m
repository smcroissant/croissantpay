#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CroissantPay, NSObject)

RCT_EXTERN_METHOD(configure:(NSString *)apiKey
                  apiUrl:(NSString *)apiUrl
                  debugLogs:(BOOL)debugLogs
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getProducts:(NSArray *)productIds
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(purchase:(NSString *)productId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(restorePurchases:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(finishTransaction:(NSString *)transactionId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

