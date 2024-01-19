#include <napi.h>
#include "register.h"
#include "wakeup.h"


Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Register::Init(env, exports);
    Wakeup::Init(env, exports);
    return exports;
}

NODE_API_MODULE(webchiaki, Init);