require_relative "boot"

require "rails"
require "action_controller/railtie"
require "active_job/railtie"

module RailsWebhooks
  class Application < Rails::Application
    config.load_defaults 7.1
    config.api_only = true

    # Minimal Rails API for webhook handling only
    config.autoload_lib(ignore: %w(assets tasks))
  end
end
