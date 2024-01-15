#include "../include/discoverymanager.h"

#include <netdb.h>

static void discovery_cb(ChiakiDiscoveryHost *host, void *user) {
    auto *manager = static_cast<DiscoveryManager*>(user);
    if (manager) {
        if (host->state == CHIAKI_DISCOVERY_HOST_STATE_READY) {
            manager->last_state = "READY";
        } else if (host->state == CHIAKI_DISCOVERY_HOST_STATE_STANDBY) {
            manager->last_state = "STANDBY";
        } else {
            manager->last_state = "UNKNOWN";
        }
    }
}

std::string DiscoveryManager::getJamie() {
    return "jamie";
}

void DiscoveryManager::discoverHostState(std::string addr) {
    ChiakiDiscovery discovery;
    ChiakiErrorCode err = chiaki_discovery_init(&discovery, &log, AF_INET); // TODO: IPv6
    if(err != CHIAKI_ERR_SUCCESS)
    {
        CHIAKI_LOGE(&log, "Discovery init failed");
        return;
    }

    ChiakiDiscoveryThread thread;

    err = chiaki_discovery_thread_start_oneshot(&thread, &discovery, discovery_cb, this);
    if(err != CHIAKI_ERR_SUCCESS)
    {
        CHIAKI_LOGE(&log, "Discovery thread init failed");
        chiaki_discovery_fini(&discovery);
        return;
    }

    struct addrinfo *host_addrinfos;
    int r = getaddrinfo(addr.c_str(), NULL, NULL, &host_addrinfos);
    if(r != 0)
    {
        CHIAKI_LOGE(&log, "getaddrinfo failed");
        return;
    }

    struct sockaddr *host_addr = NULL;
    socklen_t host_addr_len = 0;
    for(struct addrinfo *ai=host_addrinfos; ai; ai=ai->ai_next)
    {
        if(ai->ai_protocol != IPPROTO_UDP)
            continue;
        if(ai->ai_family != AF_INET) // TODO: IPv6
            continue;

        host_addr_len = ai->ai_addrlen;
        host_addr = (struct sockaddr *)malloc(host_addr_len);
        if(!host_addr)
            break;
        memcpy(host_addr, ai->ai_addr, host_addr_len);
    }
    freeaddrinfo(host_addrinfos);

    if(!host_addr)
    {
        CHIAKI_LOGE(&log, "Failed to get addr for hostname");
        return;
    }

    float timeout_sec = 2;

    ChiakiDiscoveryPacket packet;
    memset(&packet, 0, sizeof(packet));
    packet.cmd = CHIAKI_DISCOVERY_CMD_SRCH;
    packet.protocol_version = "00020020";
    ((struct sockaddr_in *)host_addr)->sin_port = htons(CHIAKI_DISCOVERY_PORT_PS4);
    err = chiaki_discovery_send(&discovery, &packet, host_addr, host_addr_len);
    if(err != CHIAKI_ERR_SUCCESS)
        CHIAKI_LOGE(&log, "Failed to send discovery packet for PS4: %s", chiaki_error_string(err));
    packet.protocol_version = "00030010";
    ((struct sockaddr_in *)host_addr)->sin_port = htons(CHIAKI_DISCOVERY_PORT_PS5);
    err = chiaki_discovery_send(&discovery, &packet, host_addr, host_addr_len);
    if(err != CHIAKI_ERR_SUCCESS)
        CHIAKI_LOGE(&log, "Failed to send discovery packet for PS5: %s", chiaki_error_string(err));
    uint64_t timeout_ms = (timeout_sec * 1000);
    err = chiaki_thread_timedjoin(&thread.thread, NULL, timeout_ms);
    if(err != CHIAKI_ERR_SUCCESS)
    {
        if(err == CHIAKI_ERR_TIMEOUT)
        {
            CHIAKI_LOGE(&log, "Discovery request timed out after timeout: %.*f seconds", 1, timeout_sec);
            chiaki_discovery_thread_stop(&thread);
        }
        chiaki_discovery_fini(&discovery);
        return;
    }
    chiaki_discovery_fini(&discovery);
}
