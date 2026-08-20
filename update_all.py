import subprocess
import sys
import time
import os
from pathlib import Path
from datetime import datetime


BASE_DIR = Path(__file__).resolve().parent


SCRIPTS = [
    ("NEO", "neo.py"),
    ("ISS", "iss.py"),
    ("SOLAR", "solar.py"),
    ("KOREA SPACE", "korea_space.py"),
    ("WORLD SPACE", "world_space.py"),
    ("EXPLORATION", "exploration.py")
]


def run_script(name, filename):

    print()
    print("=" * 60)
    print(f"[{name}] 데이터 갱신 시작")
    print("=" * 60)

    script_path = BASE_DIR / filename

    if not script_path.exists():

        print(f"[ERROR] {filename} 파일이 없습니다.")
        return False

    try:

        # Python을 UTF-8 모드로 실행
        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"

        result = subprocess.run(
            [
                sys.executable,
                "-X",
                "utf8",
                str(script_path)
            ],

            cwd=str(BASE_DIR),

            capture_output=True,

            text=True,

            encoding="utf-8",

            errors="replace",

            env=env
        )


        if result.stdout:
            print(result.stdout)


        if result.stderr:
            print(result.stderr)


        if result.returncode == 0:

            print(f"[OK] {name} 갱신 완료")

            return True


        print(f"[FAIL] {name} 갱신 실패")
        print(f"종료 코드: {result.returncode}")

        return False


    except Exception as e:

        print(f"[ERROR] {name} 실행 오류")
        print(e)

        return False


def main():

    print()
    print("=" * 60)
    print("SPACE DATA CENTER")
    print("전체 데이터 갱신")
    print("=" * 60)

    print(
        "시작:",
        datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    )


    success = []
    failed = []


    for index, (name, filename) in enumerate(SCRIPTS):

        result = run_script(
            name,
            filename
        )


        if result:
            success.append(name)

        else:
            failed.append(name)


        # 다음 API 요청 전 잠시 대기
        if index < len(SCRIPTS) - 1:

            print()
            print("다음 데이터까지 2초 대기...")

            time.sleep(2)


    # =================================================
    # 최종 결과
    # =================================================

    print()
    print("=" * 60)
    print("DATA UPDATE RESULT")
    print("=" * 60)


    print()
    print("성공")

    for name in success:
        print(f"  - {name}")


    print()
    print("실패")

    if failed:

        for name in failed:
            print(f"  - {name}")

    else:

        print("  없음")


    print()
    print(
        f"성공 {len(success)} / "
        f"전체 {len(SCRIPTS)}"
    )


    print(
        "완료:",
        datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    )

    print("=" * 60)


if __name__ == "__main__":
    main()
