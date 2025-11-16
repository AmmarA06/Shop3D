module Api
  module Webhooks
    class ProductsController < ApplicationController
      def create
        normalized = WebhookNormalizer.normalize_product(webhook_data, shop_domain)
        BackendForwarder.forward('products/webhook/create', normalized)
        
        Rails.logger.info("Product created: #{webhook_data['id']} for #{shop_domain}")
        head :ok
      rescue StandardError => e
        Rails.logger.error("Error processing product/create webhook: #{e.message}")
        head :internal_server_error
      end

      def update
        normalized = WebhookNormalizer.normalize_product(webhook_data, shop_domain)
        BackendForwarder.forward('products/webhook/update', normalized)
        
        Rails.logger.info("Product updated: #{webhook_data['id']} for #{shop_domain}")
        head :ok
      rescue StandardError => e
        Rails.logger.error("Error processing product/update webhook: #{e.message}")
        head :internal_server_error
      end

      def delete
        normalized = {
          shop: shop_domain,
          product_id: webhook_data['id']&.to_s,
          deleted_at: Time.current.iso8601
        }
        BackendForwarder.forward('products/webhook/delete', normalized)
        
        Rails.logger.info("Product deleted: #{webhook_data['id']} for #{shop_domain}")
        head :ok
      rescue StandardError => e
        Rails.logger.error("Error processing product/delete webhook: #{e.message}")
        head :internal_server_error
      end
    end
  end
end

