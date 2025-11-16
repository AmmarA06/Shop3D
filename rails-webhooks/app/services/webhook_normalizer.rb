class WebhookNormalizer
  # Normalize Shopify product webhook to a consistent format
  def self.normalize_product(webhook_data, shop_domain)
    {
      shop: shop_domain,
      product_id: webhook_data['id']&.to_s,
      admin_graphql_api_id: webhook_data['admin_graphql_api_id'],
      title: webhook_data['title'],
      handle: webhook_data['handle'],
      status: webhook_data['status'],
      body_html: webhook_data['body_html'],
      vendor: webhook_data['vendor'],
      product_type: webhook_data['product_type'],
      tags: parse_tags(webhook_data['tags']),
      images: normalize_images(webhook_data['images'] || []),
      variants: normalize_variants(webhook_data['variants'] || []),
      created_at: webhook_data['created_at'],
      updated_at: webhook_data['updated_at'],
      published_at: webhook_data['published_at']
    }
  end

  private

  def self.parse_tags(tags)
    return [] if tags.blank?
    tags.is_a?(Array) ? tags : tags.split(',').map(&:strip)
  end

  def self.normalize_images(images)
    images.map do |image|
      {
        id: image['id']&.to_s,
        src: image['src'],
        alt: image['alt'],
        width: image['width'],
        height: image['height'],
        position: image['position']
      }
    end
  end

  def self.normalize_variants(variants)
    variants.map do |variant|
      {
        id: variant['id']&.to_s,
        admin_graphql_api_id: variant['admin_graphql_api_id'],
        title: variant['title'],
        sku: variant['sku'],
        price: variant['price'],
        compare_at_price: variant['compare_at_price'],
        image_id: variant['image_id']&.to_s,
        inventory_quantity: variant['inventory_quantity'],
        position: variant['position']
      }
    end
  end
end

