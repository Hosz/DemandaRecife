package com.uninassau.demandarecife.push.support;

import com.uninassau.demandarecife.push.entity.PushSubscription;

/** Porta de saída do push. Separada da biblioteca para o resto do código ser testável. */
public interface PushGateway {

    enum Result { SENT, EXPIRED, FAILED, DISABLED }

    Result send(PushSubscription subscription, String payload);
}