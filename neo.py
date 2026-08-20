import requests
import json
import os
from datetime import datetime, timedelta


# ==================================================
# NASA API KEY
# ==================================================

NASA_API_KEY = "8DDd31fzdcQkoCD3pMJ2avBosCwWsFTGEQsM1Wh3"


# ==================================================
# 설정
# ==================================================

# 오늘 날짜
today = datetime.now().strftime("%Y-%m-%d")


# NASA NEO API
url = "https://api.nasa.gov/neo/rest/v1/feed"


params = {
    "start_date": today,
    "end_date": today,
    "detailed": "false",
    "api_key": NASA_API_KEY
}


# ==================================================
# 데이터 폴더
# ==================================================

DATA_DIR = "data"

os.makedirs(
    DATA_DIR,
    exist_ok=True
)


OUTPUT_FILE = os.path.join(
    DATA_DIR,
    "neo.json"
)


# ==================================================
# NASA API 요청
# ==================================================

print()
print("NEO 데이터를 가져오는 중...")


try:

    response = requests.get(
        url,
        params=params,
        timeout=30
    )


    # HTTP 오류 확인

    response.raise_for_status()


    data = response.json()


    # ==================================================
    # NEO 데이터 확인
    # ==================================================

    neo_objects = []


    for date, objects in data.get(
        "near_earth_objects",
        {}
    ).items():

        for asteroid in objects:

            # 접근 정보

            approach_data = asteroid.get(
                "close_approach_data",
                []
            )


            if not approach_data:

                continue


            approach = approach_data[0]


            # 거리

            miss_distance = approach.get(
                "miss_distance",
                {}
            )


            distance_km = float(
                miss_distance.get(
                    "kilometers",
                    0
                )
            )


            distance_au = float(
                miss_distance.get(
                    "astronomical",
                    0
                )
            )


            distance_lunar = float(
                miss_distance.get(
                    "lunar",
                    0
                )
            )


            # 속도

            velocity = approach.get(
                "relative_velocity",
                {}
            )


            velocity_km_s = float(
                velocity.get(
                    "kilometers_per_second",
                    0
                )
            )


            velocity_km_h = float(
                velocity.get(
                    "kilometers_per_hour",
                    0
                )
            )


            # 크기

            diameter = asteroid.get(
                "estimated_diameter",
                {}
            )


            meters = diameter.get(
                "meters",
                {}
            )


            diameter_min = float(
                meters.get(
                    "estimated_diameter_min",
                    0
                )
            )


            diameter_max = float(
                meters.get(
                    "estimated_diameter_max",
                    0
                )
            )


            # ==================================================
            # 저장할 데이터
            # ==================================================

            neo_objects.append({

                "id":
                    asteroid.get(
                        "id"
                    ),

                "name":
                    asteroid.get(
                        "name",
                        "Unknown"
                    ),

                "reference_id":
                    asteroid.get(
                        "neo_reference_id"
                    ),

                "date":
                    date,

                "approach_time":
                    approach.get(
                        "close_approach_date_full"
                    ),

                "distance_km":
                    distance_km,

                "distance_au":
                    distance_au,

                "distance_lunar":
                    distance_lunar,

                "velocity_km_s":
                    velocity_km_s,

                "velocity_km_h":
                    velocity_km_h,

                "diameter_min_m":
                    diameter_min,

                "diameter_max_m":
                    diameter_max,

                "hazardous":
                    asteroid.get(
                        "is_potentially_hazardous_asteroid",
                        False
                    ),

                "sentry":
                    asteroid.get(
                        "is_sentry_object",
                        False
                    ),

                "nasa_jpl_url":
                    asteroid.get(
                        "nasa_jpl_url"
                    )

            })


    # ==================================================
    # 가까운 순서로 정렬
    # ==================================================

    neo_objects.sort(
        key=lambda x:
            x["distance_km"]
    )


    # ==================================================
    # JSON 저장
    # ==================================================

    output = {

        "updated_at":
            datetime.now().isoformat(),

        "date":
            today,

        "count":
            len(neo_objects),

        "objects":
            neo_objects

    }


    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            output,
            file,
            ensure_ascii=False,
            indent=2
        )


    # ==================================================
    # 결과 출력
    # ==================================================

    print()
    print("NEO 데이터 갱신 완료")
    print(
        f"오늘 접근하는 NEO: "
        f"{len(neo_objects)}개"
    )

    print(
        f"저장 위치: {OUTPUT_FILE}"
    )


    if neo_objects:

        print()
        print(
            "가장 가까운 소행성:"
        )


        closest = neo_objects[0]


        print(
            closest["name"]
        )


        print(
            f"거리: "
            f"{closest['distance_km']:,.0f} km"
        )


        print(
            f"속도: "
            f"{closest['velocity_km_s']:.2f} km/s"
        )


except requests.exceptions.HTTPError as e:

    print()
    print("NASA API 요청 실패")
    print(e)


except requests.exceptions.RequestException as e:

    print()
    print("인터넷 또는 NASA API 연결 오류")
    print(e)


except Exception as e:

    print()
    print("데이터 처리 오류")
    print(e)