require "active_support/core_ext/integer/time"

Rails.application.configure do
  config.cache_classes = true
  config.eager_load = true
  config.consider_all_requests_local = false
  config.public_file_server.enabled = false

  # Logging
  config.log_level = :info
  config.log_tags = [:request_id]
  config.logger = ActiveSupport::Logger.new(STDOUT)
    .tap  { |logger| logger.formatter = ::Logger::Formatter.new }

  # Error reporting
  config.active_support.report_deprecations = false

  # Force all access to the app over SSL
  config.force_ssl = false

  # Cache store
  config.cache_store = :redis_cache_store, { url: ENV['REDIS_URL'] }
end

