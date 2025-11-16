class ApplicationController < ActionController::API
  before_action :verify_shopify_webhook

  private

  def verify_shopify_webhook
    return if Rails.env.development? && ENV['SKIP_WEBHOOK_VERIFICATION'] == 'true'

    data = request.body.read
    hmac_header = request.headers['X-Shopify-Hmac-SHA256']

    unless hmac_header
      Rails.logger.warn("Missing HMAC header")
      render json: { error: 'Unauthorized' }, status: :unauthorized
      return
    end

    calculated_hmac = Base64.strict_encode64(
      OpenSSL::HMAC.digest('sha256', ENV['SHOPIFY_WEBHOOK_SECRET'], data)
    )

    unless ActiveSupport::SecurityUtils.secure_compare(calculated_hmac, hmac_header)
      Rails.logger.warn("HMAC verification failed")
      render json: { error: 'Unauthorized' }, status: :unauthorized
      return
    end

    # Store parsed data for controller use
    @webhook_data = JSON.parse(data)
  rescue JSON::ParserError => e
    Rails.logger.error("JSON parsing error: #{e.message}")
    render json: { error: 'Invalid JSON' }, status: :bad_request
  end

  def webhook_data
    @webhook_data
  end

  def shop_domain
    request.headers['X-Shopify-Shop-Domain']
  end
end

