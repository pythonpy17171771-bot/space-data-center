import json
import os
import requests
from datetime import datetime, timedelta, timezone

BASE_URL = "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get"

today = datetime.now(timezone.utc).date()
start_date = today - timedelta(days=7)

params = {
    "startDate": start_date.isoformat(),
    "endDate": today.isoformat()
}

print("🌞 NASA DONKI 태양활동 데이터를 가져오는 중...")
print(f"📅 기간: {start_date} ~ {today}")

result = {
    "period": {
        "start": start_date.isoformat(),
        "end": today.isoformat()
    },
    "solar_flares": [],
    "cme": [],
    "geomagnetic_storms": [],
    "solar_energetic_particles": []
}


def get_data(endpoint):
    url = f"{BASE_URL}/{endpoint}"

    response = requests.get(
        url,
        params=params,
        timeout=20
    )

    response.raise_for_status()

    return response.json()


try:
    # 태양 플레어
    result["solar_flares"] = get_data("FLR")

    print(
        f"🔥 Solar Flare: "
        f"{len(result['solar_flares'])}개"
    )

    # 코로나 질량 방출
    result["cme"] = get_data("CME")

    print(
        f"☀️ CME: "
        f"{len(result['cme'])}개"
    )

    # 지자기 폭풍
    result["geomagnetic_storms"] = get_data("GST")

    print(
        f"🌍 Geomagnetic Storm: "
        f"{len(result['geomagnetic_storms'])}개"
    )

    # 태양 고에너지 입자
    result["solar_energetic_particles"] = get_data("SEP")

    print(
        f"⚡ SEP: "
        f"{len(result['solar_energetic_particles'])}개"
    )

    os.makedirs("data", exist_ok=True)

    with open("data/solar.json", "w", encoding="utf-8") as f:
        json.dump(
            result,
            f,
            ensure_ascii=False,
            indent=2
        )

    print()
    print("✅ 태양활동 데이터 저장 완료")
    print("📁 data/solar.json")

except requests.RequestException as e:
    print("❌ NASA DONKI API 요청 실패:", e)

except Exception as e:
    print("❌ 오류:", e)