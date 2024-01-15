#include <napi.h>
#include "discoverymanager.h"
#include "native-addon.h"

Napi::Value Discover(const Napi::CallbackInfo& info) {
    DiscoveryManager discovery_manager{};
    discovery_manager.discoverHostState("192.168.0.103");
    std::string state = discovery_manager.last_state;
    return Napi::String::From(info.Env(), state);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "discover"), Napi::Function::New(env, Discover));
    NativeAddon::Init(env, exports);
    return exports;
}

NODE_API_MODULE(webchiaki, Init);