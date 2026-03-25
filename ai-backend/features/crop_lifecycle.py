from datetime import datetime, timedelta

def configure_crop_cycle(crop_name, sowing_date_str):
    '''
    Calculates important milestone dates for a crop.
    This logic would be stored in the database to trigger periodic notifications to the farmer.
    '''
    try:
        sow_date = datetime.strptime(sowing_date_str, "%Y-%m-%d")
    except ValueError:
        return {"error": "Invalid date format. Use YYYY-MM-DD."}
        
    crop_data = {
        "tomato": {
            "germination_days": 10,
            "first_fertilizer_days": 20,
            "flowering_days": 45,
            "harvest_days": 75
        },
        # Add other crops...
    }
    
    crop = crop_name.lower()
    if crop not in crop_data:
        return {"error": f"Lifecycle data not found for {crop}."}
        
    cycle = crop_data[crop]
    milestones = {
        "germination_check": (sow_date + timedelta(days=cycle["germination_days"])).strftime("%Y-%m-%d"),
        "first_fertilizer": (sow_date + timedelta(days=cycle["first_fertilizer_days"])).strftime("%Y-%m-%d"),
        "flowering_care": (sow_date + timedelta(days=cycle["flowering_days"])).strftime("%Y-%m-%d"),
        "harvest_start": (sow_date + timedelta(days=cycle["harvest_days"])).strftime("%Y-%m-%d"),
    }
    
    return {
        "crop": crop.capitalize(),
        "sown_on": sowing_date_str,
        "upcoming_milestones": milestones,
        "action": "Store this in Postgres/Firebase to trigger Cron jobs/Push Notifications via Expo Notifications."
    }

# Example Usage
if __name__ == "__main__":
    profile = configure_crop_cycle("tomato", "2026-03-20")
    print(profile)
