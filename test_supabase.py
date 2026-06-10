from supabase import create_client
import os

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print("URL :", bool(url))
print("KEY :", bool(key))

supabase = create_client(url, key)

try:
    result = supabase.table("projects").select("*").limit(1).execute()
    print("SUCCESS")
    print(result.data)
except Exception as e:
    print("ERROR")
    print(e)
