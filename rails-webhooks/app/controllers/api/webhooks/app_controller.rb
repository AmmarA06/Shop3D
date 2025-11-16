module Api
  module Webhooks
    class AppController < ApplicationController
      def uninstalled
        normalized = {
          shop: shop_domain,
          uninstalled_at: Time.current.iso8601
        }
        BackendForwarder.forward('app/webhook/uninstalled', normalized)
        
        Rails.logger.info("App uninstalled for #{shop_domain}")
        head :ok
      rescue StandardError => e
        Rails.logger.error("Error processing app/uninstalled webhook: #{e.message}")
        head :internal_server_error
      end
    end
  end
end

