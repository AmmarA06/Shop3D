require 'net/http'
require 'json'

class BackendForwarder
  TIMEOUT = 10 # seconds

  # Forward normalized webhook data to Node.js backend
  def self.forward(endpoint, data)
    backend_url = ENV['BACKEND_URL'] || 'http://localhost:5000'
    url = URI.join(backend_url, "/api/#{endpoint}")

    Rails.logger.info("Forwarding to backend: POST #{url}")

    http = Net::HTTP.new(url.host, url.port)
    http.use_ssl = url.scheme == 'https'
    http.open_timeout = TIMEOUT
    http.read_timeout = TIMEOUT

    request = Net::HTTP::Post.new(url)
    request['Content-Type'] = 'application/json'
    request['X-Webhook-Source'] = 'rails-webhook-service'
    request.body = data.to_json

    response = http.request(request)

    case response.code.to_i
    when 200..299
      Rails.logger.info("Backend responded: #{response.code}")
      true
    else
      Rails.logger.error("Backend error: #{response.code} - #{response.body}")
      false
    end
  rescue StandardError => e
    Rails.logger.error("Failed to forward to backend: #{e.message}")
    false
  end
end

