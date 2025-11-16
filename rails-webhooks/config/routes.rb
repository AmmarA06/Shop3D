Rails.application.routes.draw do
  # Health check
  get '/health', to: 'health#index'
  
  # Shopify webhooks
  namespace :api do
    namespace :webhooks do
      post '/products/create', to: 'products#create'
      post '/products/update', to: 'products#update'
      post '/products/delete', to: 'products#delete'
      post '/app/uninstalled', to: 'app#uninstalled'
    end
  end
end

