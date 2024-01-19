#include "wakeup.h"

#include <QtCore/qbytearray.h>
#include <QtCore/QString>

#include "chiaki/log.h"
#include "chiaki/discovery.h"

Napi::FunctionReference Wakeup::constructor;

Napi::Object Wakeup::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Wakeup",{
        InstanceMethod("wake", &Wakeup::Wake)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Wakeup", func);
    return exports;
}

Wakeup::Wakeup(const Napi::CallbackInfo& info) : ObjectWrap<Wakeup>(info) {

}

Napi::Value Wakeup::Wake(const Napi::CallbackInfo& info) {
    QString regist_key_param = QString::fromStdString(info[0].As<Napi::String>());
    QString host = QString::fromStdString(info[1].As<Napi::String>());
    bool ps5 = info[2].As<Napi::Boolean>();

    ChiakiLog log;
    chiaki_log_init(&log, CHIAKI_LOG_ALL & ~CHIAKI_LOG_VERBOSE, chiaki_log_cb_print, nullptr);


    QByteArray key = regist_key_param.toUtf8();
    for(size_t i=0; i<key.size(); i++)
    {
        if(!key.at(i))
        {
            key.resize(i);
            break;
        }
    }

    bool ok;
    uint64_t credential = (uint64_t)QString::fromUtf8(key).toULongLong(&ok, 16);
    if(key.size() > 8 || !ok)
    {
        CHIAKI_LOGE(&log, "DiscoveryManager got invalid regist key for wakeup");
        throw Napi::Error::New(info.Env(), "Invalid regist key");
    }

    ChiakiErrorCode err = chiaki_discovery_wakeup(&log, nullptr, host.toUtf8().constData(), credential, ps5);

    if(err != CHIAKI_ERR_SUCCESS)
        throw Napi::Error::New(info.Env(), QString("Failed to send Packet: %1").arg(chiaki_error_string(err)).toStdString());

    return Napi::Boolean::New(info.Env(), true);
}
