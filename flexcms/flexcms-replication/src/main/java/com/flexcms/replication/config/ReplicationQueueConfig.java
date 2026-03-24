package com.flexcms.replication.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ReplicationQueueConfig {

    public static final String EXCHANGE_NAME = "flexcms.replication";
    public static final String CONTENT_ROUTING_KEY = "content.replicate";
    public static final String TREE_ROUTING_KEY = "content.replicate.tree";
    public static final String ASSET_ROUTING_KEY = "asset.replicate";
    public static final String DLQ_NAME = "flexcms.replication.dlq";

    @Value("${flexcms.instance.id:publish-default}")
    private String instanceId;

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public TopicExchange replicationExchange() {
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(DLQ_NAME).build();
    }

    /**
     * Each publish instance gets its own queue to ensure all instances receive every event.
     */
    @Bean
    @ConditionalOnProperty(name = "flexcms.runmode", havingValue = "publish")
    public Queue publishQueue() {
        return QueueBuilder.durable("flexcms.publish." + instanceId)
                .deadLetterExchange("")
                .deadLetterRoutingKey(DLQ_NAME)
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "flexcms.runmode", havingValue = "publish")
    public Binding contentBinding(Queue publishQueue, TopicExchange replicationExchange) {
        return BindingBuilder.bind(publishQueue).to(replicationExchange).with("content.replicate.#");
    }

    @Bean
    @ConditionalOnProperty(name = "flexcms.runmode", havingValue = "publish")
    public Binding assetBinding(Queue publishQueue, TopicExchange replicationExchange) {
        return BindingBuilder.bind(publishQueue).to(replicationExchange).with("asset.replicate.#");
    }
}

