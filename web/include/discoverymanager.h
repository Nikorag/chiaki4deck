#ifndef DISCOVERYMANAGER_H
#define DISCOVERYMANAGER_H

#include <napi.h>
#include <string>

#include "chiaki/discovery.h"
#include <chiaki/discoveryservice.h>

class DiscoveryManager {
    private:
        ChiakiLog log;

    public:
        std::string last_state;
        std::string getJamie();
        void discoverHostState(std::string addr);
};

#endif //DISCOVERYMANAGER_H