# =====================================================
# 🛰️ ISS CURRENT LOCATION
# =====================================================

import requests
import json
from pathlib import Path
from datetime import datetime, timezone


ISS_URL = "https://api.wheretheiss.at/v1/satellites/25544"

OUTPUT_FILE = Path("data/iss.json")


def get_iss():

    print("=" * 59)
    print("🛰️ ISS 현재 위치를 가져오는 중...")

    try:

        response = requests.get(
            ISS_URL,
            timeout=15
        )

        response.raise_for_status()

        data = response.json()


        # =================================================
        # 필요한 데이터만 정리
        # =================================================

        iss_data = {

            "latitude": data.get("latitude"),

            "longitude": data.get("longitude"),

            "altitude": data.get("altitude"),

            "velocity": data.get("velocity"),

            "visibility": data.get("visibility"),

            "timestamp": datetime.now(
                timezone.utc
            ).isoformat(),

            "source": ISS_URL

        }


        # =================================================
        # 저장 폴더 생성
        # =================================================

        OUTPUT_FILE.parent.mkdir(
            parents=True,
            exist_ok=True
        )


        # =================================================
        # JSON 저장
        # =================================================

        with open(
            OUTPUT_FILE,
            "w",
            encoding="utf-8"
        ) as f:

            json.dump(
                iss_data,
                f,
                ensure_ascii=False,
                indent=4
            )


        # =================================================
        # 결과 출력
        # =================================================

        print()

        print(
            f"🌐 위도      : {iss_data['latitude']}°"
        )

        print(
            f"🌐 경도      : {iss_data['longitude']}°"
        )

        print(
            f"📏 고도      : {iss_data['altitude']} km"
        )

        print(
            f"🚀 속도      : {iss_data['velocity']} km/h"
        )

        print(
            f"👁️ 가시성    : {iss_data['visibility']}"
        )

        print()

        print(
            f"💾 저장 완료 : {OUTPUT_FILE}"
        )

        print(
            "[OK] ISS 갱신 완료"
        )

        return True


    except requests.exceptions.Timeout:

        print(
            "❌ ISS API 요청 시간 초과"
        )

        print(
            "[FAIL] ISS 갱신 실패"
        )

        return False


    except requests.exceptions.RequestException as e:

        print(
            f"❌ ISS API 요청 실패: {e}"
        )

        print(
            "[FAIL] ISS 갱신 실패"
        )

        return False


    except Exception as e:

        print(
            f"❌ ISS 데이터 처리 실패: {e}"
        )

        print(
            "[FAIL] ISS 갱신 실패"
        )

        return False


# =====================================================
# 실행
# =====================================================

if __name__ == "__main__":

    get_iss()