class HealthController < ActionController::API
  def index
    render json: { 
      status: 'healthy',
      service: 'rails-webhooks',
      timestamp: Time.current.iso8601
    }
  end
end

