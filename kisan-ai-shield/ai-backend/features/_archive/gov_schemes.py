def search_schemes(keywords):
    '''
    A naive mock for finding Government agricultural schemes based on keyword tags.
    In a real system, this would be a Vector Database (like Pinecone/Chroma) where 
    scheme documents are embedded and retrieved using RAG (Retrieval-Augmented Generation).
    '''
    
    mock_database = [
        {
            "id": 1,
            "name": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
            "description": "Provides income support of ₹6,000 per year to landholding farmer families.",
            "tags": ["income", "cash", "support", "general"]
        },
        {
            "id": 2,
            "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
            "description": "Insurance cover to farmers against crop failure due to natural calamities.",
            "tags": ["insurance", "weather", "damage", "failure"]
        },
        {
            "id": 3,
            "name": "Paramparagat Krishi Vikas Yojana (PKVY)",
            "description": "Promotes organic farming through cluster approach.",
            "tags": ["organic", "fertilizer", "sustainable"]
        }
    ]
    
    results = []
    for scheme in mock_database:
        # Check if any input keyword matches the scheme's tags
        if any(kw.lower() in scheme["tags"] for kw in keywords):
            results.append(scheme)
            
    if not results:
        return {"response": "No specific schemes found. Try asking about 'insurance' or 'organic farming'."}
        
    formatted_reply = "Here are some schemes you might be eligible for:\\n"
    for r in results:
        formatted_reply += f"- **{r['name']}**: {r['description']}\\n"
        
    return {"response": formatted_reply}

# Example Usage
if __name__ == "__main__":
    user_query_tags = ["insurance", "damage"]
    answer = search_schemes(user_query_tags)
    print(answer["response"])
