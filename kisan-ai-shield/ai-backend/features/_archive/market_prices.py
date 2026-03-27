import requests

def get_live_mandi_prices(commodity="tomato", state="Telangana", district="Hyderabad"):
    '''
    Mock integration for National Agricultural Market (e-NAM) or Agmarknet.
    Fetches real-time prices for a specific crop to answer queries like 
    'What price can I get for tomatoes today?'
    '''
    # In reality, this would query a Govt API, e.g., data.gov.in
    # url = f"https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key={API_KEY}&format=json&filters[commodity]={commodity}"
    
    print(f"Fetching real-time price data for {commodity} in {district}, {state}...")
    
    # Mock Response
    mock_db = {
        "tomato": {
            "min_price": 2500, # INR per Quintal
            "max_price": 3200,
            "modal_price": 2800,
            "date": "2026-03-24"
        },
        "rice": {
            "min_price": 3900,
            "max_price": 4500,
            "modal_price": 4200,
            "date": "2026-03-24"
        }
    }
    
    com = commodity.lower()
    if com in mock_db:
        price_data = mock_db[com]
        return (f"The current market price for {commodity.capitalize()} in your district is "
                f"₹{price_data['modal_price']} per quintal. (Range: ₹{price_data['min_price']} - ₹{price_data['max_price']})")
    else:
        return f"Currently, no real-time data is available for {commodity}."

# Example Usage
if __name__ == "__main__":
    reply = get_live_mandi_prices("tomato")
    print(reply)
