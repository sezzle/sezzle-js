# https://help.shopify.com/en/manual/checkout-settings/script-editor/create#create-a-script

sezzle_limit = 8000
if Input.cart.subtotal_price > (Money.new(cents: 100) * sezzle_limit)
    Output.payment_gateways = Input.payment_gateways.delete_if { |payment_gateway| payment_gateway.name.downcase.strip.include?("sezzle") }
else
    Output.payment_gateways = Input.payment_gateways
end