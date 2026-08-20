// =====================================================
// SPACE DATA CENTER
// =====================================================

const DATA_PATH = "data/";


// =====================================================
// JSON
// =====================================================

async function getJSON(filename) {

    const response = await fetch(
        DATA_PATH + filename + "?t=" + Date.now()
    );

    if (!response.ok) {

        throw new Error(
            `${filename} 불러오기 실패: ${response.status}`
        );

    }

    return await response.json();

}


// =====================================================
// 숫자 포맷
// =====================================================

function formatNumber(value, digits = 2) {

    const number = Number(value);

    if (!Number.isFinite(number)) {

        return "-";

    }

    return number.toLocaleString(
        "ko-KR",
        {
            maximumFractionDigits: digits
        }
    );

}


// =====================================================
// SECTION
// =====================================================

function showSection(sectionId) {

    document
        .querySelectorAll(".section")
        .forEach(section => {

            section.classList.remove("active");

        });


    const target =
        document.getElementById(sectionId);


    if (target) {

        target.classList.add("active");

    }


    document
        .querySelectorAll("[data-section]")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section === sectionId
            );

        });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    // WORLD SPACE로 이동했을 때
    // Chart.js 크기 다시 계산

    if (
        sectionId === "world" &&
        worldSpaceChart
    ) {

        setTimeout(() => {

            worldSpaceChart.resize();

        }, 100);

    }


    // 🇰🇷 KOREA SPACE로 이동했을 때
    // Chart.js 크기 다시 계산

    if (
        sectionId === "korea" &&
        koreaSpaceChart
    ) {

        setTimeout(() => {

            koreaSpaceChart.resize();

        }, 100);

    }

}


document
    .querySelectorAll("[data-section]")
    .forEach(element => {

        element.addEventListener(
            "click",
            () => {

                showSection(
                    element.dataset.section
                );

            }
        );

    });


// =====================================================
// 공통 카드
// =====================================================

function addDataCard(
    container,
    title,
    value,
    unit = ""
) {

    const card =
        document.createElement("div");

    card.className = "data-card";

    card.innerHTML = `

        <h3>
            ${title}
        </h3>

        <div class="data-value">
            ${value}
        </div>

        <div class="data-label">
            ${unit}
        </div>

    `;

    container.appendChild(card);

}


// =====================================================
// ISS
// =====================================================

async function loadISS() {

    const status =
        document.getElementById("issStatus");

    const container =
        document.getElementById("issData");


    if (!container) {

        return;

    }


    try {

        const data =
            await getJSON("iss.json");


        status.textContent =
            "현재 ISS 데이터를 불러왔습니다.";


        container.innerHTML = "";


        const latitude =
            data.latitude ??
            data.lat ??
            data.position?.latitude;


        const longitude =
            data.longitude ??
            data.lon ??
            data.position?.longitude;


        const altitude =
            data.altitude ??
            data.altitude_km ??
            data.position?.altitude;


        const velocity =
            data.velocity ??
            data.velocity_km_s ??
            data.position?.velocity;


        const timestamp =
            data.timestamp ??
            data.updated_at ??
            data.time;


        if (latitude !== undefined) {

            addDataCard(
                container,
                "🌐 위도",
                formatNumber(latitude, 4),
                "degrees"
            );

        }


        if (longitude !== undefined) {

            addDataCard(
                container,
                "🌐 경도",
                formatNumber(longitude, 4),
                "degrees"
            );

        }


        if (altitude !== undefined) {

            addDataCard(
                container,
                "📏 고도",
                formatNumber(altitude, 2),
                "km"
            );

        }


        if (velocity !== undefined) {

            addDataCard(
                container,
                "🚀 속도",
                formatNumber(velocity, 2),
                "km/s"
            );

        }


        if (timestamp !== undefined) {

    const date = new Date(timestamp);

    const formattedTime =
        !Number.isNaN(date.getTime())
            ? date.toLocaleString("ko-KR", {
                timeZone: "Asia/Seoul",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            })
            : timestamp;

    addDataCard(
        container,
        "🕐 측정 시간",
        formattedTime,
        "대한민국 표준시 (KST)"
    );

}


    } catch (error) {

        console.error("[ISS]", error);

        status.textContent =
            "❌ ISS 데이터 갱신 실패";

    }

}


// =====================================================
// NEO
// =====================================================

let neoData = [];


async function loadNEO() {

    const status =
        document.getElementById("neoStatus");


    try {

        const json =
            await getJSON("neo.json");


        if (Array.isArray(json.objects)) {

            neoData =
                json.objects;

        } else {

            neoData = [];

        }


        status.textContent =
            `총 ${neoData.length}개의 NEO`;


        renderNEO();


    } catch (error) {

        console.error("[NEO]", error);

        status.textContent =
            "❌ NEO 데이터 갱신 실패";

    }

}


// =====================================================
// NEO 렌더링
// =====================================================

function renderNEO() {

    const container =
        document.getElementById("neoData");


    if (!container) {

        return;

    }


    const distanceElement =
        document.getElementById("neoDistance");


    const sizeElement =
        document.getElementById("neoSize");


    const distance =
        distanceElement
            ? distanceElement.value
            : "all";


    const size =
        sizeElement
            ? sizeElement.value
            : "all";


    let filtered =
        [...neoData];


    if (distance !== "all") {

        const maxDistance =
            Number(distance) * 1000000;


        filtered =
            filtered.filter(item => {

                const value =
                    Number(item.distance_km);


                return (
                    Number.isFinite(value) &&
                    value <= maxDistance
                );

            });

    }


    if (size !== "all") {

        filtered =
            filtered.filter(item => {

                const min =
                    Number(item.diameter_min_m);


                const max =
                    Number(item.diameter_max_m);


                if (
                    !Number.isFinite(min) ||
                    !Number.isFinite(max)
                ) {

                    return false;

                }


                const average =
                    (min + max) / 2;


                if (size === "small") {

                    return average <= 100;

                }


                if (size === "medium") {

                    return (
                        average > 100 &&
                        average < 1000
                    );

                }


                if (size === "large") {

                    return average >= 1000;

                }


                return true;

            });

    }


    container.innerHTML = "";


    if (filtered.length === 0) {

        container.innerHTML = `

            <div class="status-message">
                조건에 맞는 NEO가 없습니다.
            </div>

        `;

        return;

    }


    filtered.forEach(item => {

        const card =
            document.createElement("article");


        card.className =
            "neo-card";


        const distance =
            Number(item.distance_km);


        const lunar =
            Number(item.distance_lunar);


        const velocity =
            Number(item.velocity_km_s);


        const minSize =
            Number(item.diameter_min_m);


        const maxSize =
            Number(item.diameter_max_m);


        const hazardous =
            item.hazardous === true;


        card.innerHTML = `

            <div class="neo-name">
                ☄️ ${item.name ?? "Unknown NEO"}
            </div>

            <div class="neo-info">

                <div>
                    <small>접근 거리</small>
                    <strong>
                        ${
                            Number.isFinite(distance)
                                ? formatNumber(distance, 0)
                                : "-"
                        } km
                    </strong>
                </div>

                <div>
                    <small>달 거리</small>
                    <strong>
                        ${
                            Number.isFinite(lunar)
                                ? formatNumber(lunar, 1)
                                : "-"
                        } LD
                    </strong>
                </div>

                <div>
                    <small>속도</small>
                    <strong>
                        ${
                            Number.isFinite(velocity)
                                ? formatNumber(velocity, 2)
                                : "-"
                        } km/s
                    </strong>
                </div>

                <div>
                    <small>추정 크기</small>
                    <strong>
                        ${
                            Number.isFinite(minSize) &&
                            Number.isFinite(maxSize)
                                ? `${formatNumber(minSize, 1)}
                                   ~
                                   ${formatNumber(maxSize, 1)} m`
                                : "-"
                        }
                    </strong>
                </div>

                <div>
                    <small>접근 예정</small>
                    <strong>
                        ${item.approach_time ?? "-"}
                    </strong>
                </div>

                <div>
                    <small>위험 여부</small>
                    <strong>
                        ${
                            hazardous
                                ? "⚠️ 위험 가능"
                                : "✅ 비위험"
                        }
                    </strong>
                </div>

            </div>

        `;


        if (item.nasa_jpl_url) {

            card.style.cursor =
                "pointer";


            card.addEventListener(
                "click",
                () => {

                    window.open(
                        item.nasa_jpl_url,
                        "_blank"
                    );

                }
            );

        }


        container.appendChild(card);

    });

}


// =====================================================
// SOLAR
// =====================================================

async function loadSolar() {

    const summary =
        document.getElementById(
            "solarSummary"
        );


    const container =
        document.getElementById(
            "solarData"
        );


    try {

        const json =
            await getJSON("solar.json");


        const flares =
            Array.isArray(json.solar_flares)
                ? json.solar_flares
                : [];


        const cme =
            Array.isArray(json.cme)
                ? json.cme
                : [];


        summary.innerHTML = `

            <div class="stat-card">

                <span>🔥</span>

                <strong>
                    태양 플레어
                </strong>

                <b>
                    ${flares.length}
                </b>

            </div>


            <div class="stat-card">

                <span>💥</span>

                <strong>
                    CME
                </strong>

                <b>
                    ${cme.length}
                </b>

            </div>


            <div class="stat-card">

                <span>☀️</span>

                <strong>
                    전체 활동
                </strong>

                <b>
                    ${flares.length + cme.length}
                </b>

            </div>

        `;


        container.innerHTML = "";


        flares.forEach(item => {

            const div =
                document.createElement("div");


            div.className =
                "solar-item";


            div.innerHTML = `

                <strong>
                    🔥 SOLAR FLARE
                </strong>

                <div>
                    등급:
                    ${item.classType ?? "-"}
                </div>

                <div>
                    시작:
                    ${item.beginTime ?? "-"}
                </div>

                <div>
                    최대:
                    ${item.peakTime ?? "-"}
                </div>

                <div>
                    종료:
                    ${item.endTime ?? "-"}
                </div>

                <div>
                    위치:
                    ${item.sourceLocation || "-"}
                </div>

                <div>
                    활동 지역:
                    ${item.activeRegionNum ?? "-"}
                </div>

            `;


            if (item.link) {

                div.style.cursor =
                    "pointer";


                div.addEventListener(
                    "click",
                    () => {

                        window.open(
                            item.link,
                            "_blank"
                        );

                    }
                );

            }


            container.appendChild(div);

        });


        cme.forEach(item => {

            const div =
                document.createElement("div");


            div.className =
                "solar-item";


            let analysis = null;


            if (
                Array.isArray(
                    item.cmeAnalyses
                ) &&
                item.cmeAnalyses.length > 0
            ) {

                analysis =
                    item.cmeAnalyses.find(
                        a =>
                            a.isMostAccurate === true
                    )
                    ||
                    item.cmeAnalyses[0];

            }


            div.innerHTML = `

                <strong>
                    💥 CME
                </strong>

                <div>
                    발생:
                    ${item.startTime ?? "-"}
                </div>

                <div>
                    위치:
                    ${item.sourceLocation || "-"}
                </div>

                <div>
                    속도:
                    ${
                        Number.isFinite(
                            Number(analysis?.speed)
                        )
                            ? formatNumber(
                                analysis.speed,
                                0
                            ) + " km/s"
                            : "-"
                    }
                </div>

                <div>
                    위도:
                    ${
                        analysis?.latitude != null
                            ? analysis.latitude + "°"
                            : "-"
                    }
                </div>

                <div>
                    경도:
                    ${
                        analysis?.longitude != null
                            ? analysis.longitude + "°"
                            : "-"
                    }
                </div>

                <div>
                    활동 ID:
                    ${item.activityID ?? "-"}
                </div>

            `;


            container.appendChild(div);

        });


    } catch (error) {

        console.error("[SOLAR]", error);

        summary.innerHTML = "";

        container.innerHTML = `

            <div class="status-message">
                ❌ 태양활동 데이터를
                불러오지 못했습니다.
            </div>

        `;

    }

}


// =====================================================
// 🇰🇷 KOREA SPACE
// =====================================================
// =====================================================
// 🇰🇷 KOREA SPACE
// =====================================================
//
// 단위: 백만원
//
// 2010 ~ 2021 : 공공데이터 API
// 2022 ~ 2023 : 공식 데이터
//
// 매출액
// 수출액
// 수입액
//
// 분야
// - 원격탐사
// - 위성방송통신
// - 위성항법
//
// =====================================================

let koreaSpaceChart = null;


// =====================================================
// KOREA SPACE
// =====================================================

async function loadKoreaSpace() {

    const container =
        document.getElementById("koreaData");

    const summary =
        document.getElementById("koreaSummary");


    if (!container) {

        return;

    }


    try {

        const json =
            await getJSON("korea-space.json");


        // =================================================
        // 데이터 구조 확인
        // =================================================

        let data = [];


        if (Array.isArray(json)) {

            data = json;

        }

        else if (Array.isArray(json.data)) {

            data = json.data;

        }

        else if (Array.isArray(json.results)) {

            data = json.results;

        }

        else {

            data = [json];

        }


        container.innerHTML = "";


        // =================================================
        // 데이터 없음
        // =================================================

        if (data.length === 0) {

            container.innerHTML = `

                <div class="status-message">

                    대한민국 우주산업 데이터가 없습니다.

                </div>

            `;

            return;

        }


        // =================================================
        // 연도 확인
        // =================================================

        let years = [];


        // korea-space.json의 years 사용

        if (
            Array.isArray(json.years)
        ) {

            years = json.years
                .map(year => String(year))
                .filter(year =>
                    /^\d{4}$/.test(year)
                )
                .sort();

        }


        // JSON에 years가 없을 경우
        // 실제 데이터에서 자동 수집

        if (years.length === 0) {

            const yearSet = new Set();


            data.forEach(item => {

                const values =
                    item.values ??
                    item.data ??
                    item.yearly ??
                    item.year_data ??
                    item.records;


                if (
                    values &&
                    typeof values === "object" &&
                    !Array.isArray(values)
                ) {

                    Object.keys(values)
                        .filter(year =>
                            /^\d{4}$/.test(year)
                        )
                        .forEach(year => {

                            yearSet.add(year);

                        });

                }


                else if (
                    Array.isArray(values)
                ) {

                    values.forEach(entry => {

                        const year =
                            entry?.year ??
                            entry?.YEAR ??
                            entry?.연도;


                        if (
                            year &&
                            /^\d{4}$/.test(
                                String(year)
                            )
                        ) {

                            yearSet.add(
                                String(year)
                            );

                        }

                    });

                }

            });


            years =
                [...yearSet].sort();

        }


        // =================================================
        // 최신 연도
        // =================================================

        const latestYear =
            years.length > 0
                ? years[years.length - 1]
                : "-";


        // =================================================
        // 통계
        // =================================================

        const totalCategories =
            data.length;


        summary.innerHTML = `

            <div class="stat-card">

                <span>🇰🇷</span>

                <strong>
                    데이터 항목
                </strong>

                <b>
                    ${totalCategories}
                </b>

            </div>


            <div class="stat-card">

                <span>📅</span>

                <strong>
                    최신 연도
                </strong>

                <b>
                    ${latestYear}
                </b>

            </div>


            <div class="stat-card">

                <span>📊</span>

                <strong>
                    데이터 기간
                </strong>

                <b>
                    ${
                        years.length > 0
                            ? `${years[0]} ~ ${latestYear}`
                            : "-"
                    }
                </b>

            </div>


            <div class="stat-card">

                <span>💰</span>

                <strong>
                    데이터 단위
                </strong>

                <b>
                    백만원
                </b>

            </div>

        `;


        // =================================================
        // 🇰🇷 KOREA SPACE 그래프
        // =================================================

        const koreaCanvas =
            document.getElementById(
                "koreaSpaceChart"
            );


        if (
            koreaCanvas &&
            typeof Chart !== "undefined"
        ) {

            // 기존 차트 제거

            if (koreaSpaceChart) {

                koreaSpaceChart.destroy();

                koreaSpaceChart = null;

            }


            // =================================================
            // 그래프 데이터
            // =================================================

            const datasets =
                data
                    .map(item => {

                        const values =
                            item.values ??
                            item.data ??
                            item.yearly ??
                            item.year_data ??
                            item.records;


                        const name =
                            item.name ??
                            item.NAME ??
                            item.항목 ??
                            "우주산업";


                        const yearValues =
                            years.map(year => {

                                // -------------------------
                                // 객체
                                // -------------------------

                                if (
                                    values &&
                                    typeof values === "object" &&
                                    !Array.isArray(values)
                                ) {

                                    const value =
                                        values[year];


                                    return Number(
                                        value ?? 0
                                    );

                                }


                                // -------------------------
                                // 배열
                                // -------------------------

                                if (
                                    Array.isArray(values)
                                ) {

                                    const found =
                                        values.find(
                                            entry => {

                                                const entryYear =
                                                    entry?.year ??
                                                    entry?.YEAR ??
                                                    entry?.연도;


                                                return (
                                                    String(
                                                        entryYear
                                                    ) ===
                                                    String(year)
                                                );

                                            }
                                        );


                                    return Number(

                                        found?.value ??
                                        found?.VALUE ??
                                        found?.값 ??
                                        found?.amount ??
                                        0

                                    );

                                }


                                return 0;

                            });


                        return {

                            label:
                                name,

                            data:
                                yearValues,

                            borderWidth:
                                1

                        };

                    })
                    .filter(dataset => {

                        return dataset.data.some(

                            value =>
                                Number.isFinite(value) &&
                                value !== 0

                        );

                    });


            // =================================================
            // Chart.js
            // =================================================

            if (years.length > 0) {

                koreaSpaceChart =
                    new Chart(

                        koreaCanvas,

                        {

                            type: "bar",


                            data: {

                                labels:
                                    years,

                                datasets:
                                    datasets

                            },


                            options: {

                                responsive: true,

                                maintainAspectRatio: false,


                                plugins: {

                                    legend: {

                                        display: true,

                                        position: "top"

                                    },


                                    tooltip: {

                                        callbacks: {

                                            label:
                                                function(context) {

                                                    return (

                                                        " " +

                                                        context.dataset.label +

                                                        ": " +

                                                        formatNumber(
                                                            context.raw,
                                                            0
                                                        ) +

                                                        " 백만원"

                                                    );

                                                }

                                        }

                                    }

                                },


                                scales: {

                                    x: {

                                        title: {

                                            display: true,

                                            text: "연도"

                                        }

                                    },


                                    y: {

                                        beginAtZero: true,

                                        title: {

                                            display: true,

                                            text:
                                                "금액 (백만원)"

                                        },


                                        ticks: {

                                            callback:
                                                function(value) {

                                                    return (

                                                        formatNumber(
                                                            value,
                                                            0
                                                        ) +

                                                        " 백만"

                                                    );

                                                }

                                        }

                                    }

                                }

                            }

                        }

                    );

            }

        }


        // =================================================
        // 카드
        // =================================================

        data.forEach(item => {

            if (
                !item ||
                typeof item !== "object"
            ) {

                return;

            }


            const name =
                item.name ??
                item.NAME ??
                item.항목 ??
                "대한민국 우주산업";


            const metric =
                item.metric ??
                item.METRIC ??
                item.지표 ??
                "";


            const field =
                item.field ??
                item.FIELD ??
                item.분야 ??
                "";


            const values =
                item.values ??
                item.data ??
                item.yearly ??
                item.year_data ??
                item.records;


            // =================================================
            // 카드
            // =================================================

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "korea-item";


            card.innerHTML = `

                <div class="korea-item-header">

                    <div>

                        <h3>
                            🇰🇷 ${name}
                        </h3>

                        <p>
                            ${metric}
                            ${
                                field
                                    ? " · " + field
                                    : ""
                            }
                        </p>

                    </div>


                    <span class="korea-unit">

                        단위: 백만원

                    </span>

                </div>


                <div class="korea-year-list"></div>

            `;


            const yearContainer =
                card.querySelector(
                    ".korea-year-list"
                );


            // =================================================
            // values = 객체
            // =================================================

            if (
                values &&
                typeof values === "object" &&
                !Array.isArray(values)
            ) {

                years.forEach(year => {

                    const value =
                        values[year];


                    const row =
                        document.createElement(
                            "div"
                        );


                    row.className =
                        "korea-year-row";


                    row.innerHTML = `

                        <span class="korea-year">

                            ${year}년

                        </span>


                        <strong class="korea-year-value">

                            ${
                                value === null ||
                                value === undefined
                                    ? "-"
                                    : formatNumber(
                                        value,
                                        0
                                    )
                            }

                            ${
                                value === null ||
                                value === undefined
                                    ? ""
                                    : " 백만원"
                            }

                        </strong>

                    `;


                    yearContainer.appendChild(
                        row
                    );

                });

            }


            // =================================================
            // values = 배열
            // =================================================

            else if (
                Array.isArray(values)
            ) {

                values.forEach(entry => {

                    const year =
                        entry?.year ??
                        entry?.YEAR ??
                        entry?.연도 ??
                        "-";


                    const value =
                        entry?.value ??
                        entry?.VALUE ??
                        entry?.값 ??
                        entry?.amount ??
                        null;


                    const row =
                        document.createElement(
                            "div"
                        );


                    row.className =
                        "korea-year-row";


                    row.innerHTML = `

                        <span class="korea-year">

                            ${year}년

                        </span>


                        <strong class="korea-year-value">

                            ${
                                value === null
                                    ? "-"
                                    : formatNumber(
                                        value,
                                        0
                                    )
                            }

                            ${
                                value === null
                                    ? ""
                                    : " 백만원"
                            }

                        </strong>

                    `;


                    yearContainer.appendChild(
                        row
                    );

                });

            }


            // =================================================
            // item 자체에 연도가 있는 경우
            // =================================================

            if (
                yearContainer.children.length === 0
            ) {

                Object.keys(item)
                    .filter(key =>
                        /^\d{4}$/.test(key)
                    )
                    .sort()
                    .forEach(year => {

                        const row =
                            document.createElement(
                                "div"
                            );


                        row.className =
                            "korea-year-row";


                        row.innerHTML = `

                            <span class="korea-year">

                                ${year}년

                            </span>


                            <strong class="korea-year-value">

                                ${
                                    formatNumber(
                                        item[year],
                                        0
                                    )
                                }

                                백만원

                            </strong>

                        `;


                        yearContainer.appendChild(
                            row
                        );

                    });

            }


            // =================================================
            // 데이터 없음
            // =================================================

            if (
                yearContainer.children.length === 0
            ) {

                yearContainer.innerHTML = `

                    <div class="korea-empty">

                        연도별 데이터를 찾을 수 없습니다.

                    </div>

                `;

            }


            container.appendChild(
                card
            );

        });


    } catch (error) {

        console.error(
            "[KOREA SPACE]",
            error
        );


        if (summary) {

            summary.innerHTML = "";

        }


        container.innerHTML = `

            <div class="status-message">

                ❌ 대한민국 우주산업 데이터를
                불러오지 못했습니다.

            </div>

        `;

    }

}

// =====================================================
// 🌎 WORLD SPACE R&D
// =====================================================

let worldSpaceData = null;
let worldSpaceChart = null;

// =====================================================
// LOAD WORLD SPACE DATA
// =====================================================

async function loadWorldSpace() {

    try {

        const response = await fetch(
            DATA_PATH + "world-space.json?t=" + Date.now()
        );

        if (!response.ok) {

            throw new Error(
                `world-space.json 불러오기 실패: ${response.status}`
            );

        }

        worldSpaceData = await response.json();

        renderWorldSpace();

    } catch (error) {

        console.error(
            "[WORLD SPACE]",
            error
        );

        const container =
            document.getElementById(
                "world-space-content"
            );

        if (container) {

            container.innerHTML = `

                <div class="data-error">

                    <h3>
                        WORLD SPACE DATA ERROR
                    </h3>

                    <p>
                        ${error.message}
                    </p>

                </div>

            `;

        }

    }

}


// =====================================================
// FORMAT USD
// =====================================================

function formatUSD(value) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
    ) {

        return "N/A";

    }

    return Number(value).toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


// =====================================================
// RENDER WORLD SPACE
// =====================================================

function renderWorldSpace() {

    if (!worldSpaceData) {

        return;

    }


    const container =
        document.getElementById(
            "world-space-content"
        );


    if (!container) {

        console.warn(
            "world-space-content element not found."
        );

        return;

    }


    const countries =
        Array.isArray(worldSpaceData.countries)
            ? worldSpaceData.countries
            : [];


    // =================================================
    // 각 국가 최신 데이터
    // =================================================

    const latestCountries =
        countries.map(country => {

            if (
                !Array.isArray(country.data) ||
                country.data.length === 0
            ) {

                return {
                    ...country,
                    latest: null
                };

            }


            const sortedData =
                [...country.data].sort(
                    (a, b) =>
                        Number(b.year) -
                        Number(a.year)
                );


            return {

                ...country,

                latest:
                    sortedData[0]

            };

        });


    // =================================================
    // COUNTRY CARD
    // =================================================

    const cards =
        latestCountries
            .map(country => {

                const latest =
                    country.latest;


                // 데이터 없음

                if (!latest) {

                    return `

                        <div class="world-country-card no-data">

                            <div class="country-header">

                                <div>

                                    <span class="country-code">
                                        ${country.code ?? "-"}
                                    </span>

                                    <h3>
                                        ${country.name ?? "-"}
                                    </h3>

                                </div>

                                <span class="no-data-badge">
                                    NO DATA
                                </span>

                            </div>


                            <div class="country-value">
                                N/A
                            </div>


                            <div class="country-unit">
                                OECD NABS03
                                <hr>
                                <hr>
                            </div>

                        </div>

                    `;

                }


                return `

                    <div class="world-country-card">

                        <div class="country-header">

                            <div>

                                <span class="country-code">
                                    ${country.code ?? "-"}
                                </span>

                                <h3>
                                    ${country.name ?? "-"}
                                </h3>

                            </div>


                            <span class="data-year">
                                ${latest.year ?? "-"}
                            </span>

                        </div>


                        <div class="country-value">

                            $${formatUSD(
                                latest.value_usd_million
                            )}

                            <span>
                                million
                            </span>

                        </div>


                        <div class="country-original">

                            ${formatUSD(
                                latest.value_original
                            )}

                            ${country.currency ?? ""}

                        </div>


                        <div class="country-unit">

                            OECD NABS03 · Current prices
                            <hr>
                            <hr>

                        </div>

                    </div>

                `;

            })
            .join("");


    // =================================================
    // CHART DATA
    // =================================================

    const chartCountries =
        latestCountries.filter(
            country =>
                country.latest !== null &&
                Number.isFinite(
                    Number(
                        country.latest.value_usd_million
                    )
                )
        );


    const chartLabels =
        chartCountries.map(
            country =>
                country.code
        );


    const chartValues =
        chartCountries.map(
            country =>
                Number(
                    country.latest.value_usd_million
                )
        );


    // =================================================
    // WORLD SPACE HTML
    // =================================================

    container.innerHTML = `

        <div class="world-space-header">

            <div>

                <div class="section-kicker">
                    GLOBAL SPACE ECONOMY
                </div>

                <h2>
                    World Space R&D
                </h2>

                <p>
                    우주 탐사 및 개발 분야의 정부 연구개발 예산 배정 현황을 보여줍니다.
                </p>

            </div>


            <div class="world-source">

                <span>
                    OECD
                </span>

                <small>
                    NABS03
                </small>

            </div>

        </div>


        <!-- DATA INFO -->

        <div class="world-info-bar">

            <div>

                <span>
                    데이터셋
                </span>

                <strong>
                    GBARD
                </strong>

            </div>


            <div>

                <span>
                    지표
                </span>

                <strong>
                    NABS03
                </strong>

            </div>


            <div>

                <span>
                    단위
                </span>

                <strong>
                    USD million
                </strong>

            </div>


            <div>

                <span>
                    환율 기준일
                </span>

                <strong>
                    ${
                        worldSpaceData.exchange_rate_date ??
                        "-"
                    }
                </strong>

            </div>

        </div>


        <!-- =================================================
             우주 R&D 예산
        ================================================= -->

        <div class="world-chart-card">

            <div class="chart-header">

                <div>

                    <span class="section-kicker">
                        정부 R&D
                    </span>

                    <h3>
                        우주 R&D 예산 (USD million)
                    </h3>

                </div>

            </div>


            <!-- CANVAS는 딱 1개 -->

            <div class="chart-wrapper">

                <canvas
                    id="worldSpaceChart"
                ></canvas>

            </div>

        </div>


        <!-- =================================================
             COUNTRY DATA
        ================================================= -->

        <div class="world-countries">

            <div class="world-countries-header">

                <div>

                    <span class="section-kicker">
                        국가별 데이터
                    </span>

                    <h3>
                        국가별 우주 R&D 
                    </h3>

                </div>


                <span>
                    최신 데이터 기준
                </span>

            </div>


            <div class="world-country-grid">

                ${cards}

            </div>

        </div>


        <!-- =================================================
             METHODOLOGY
        ================================================= -->

        <div class="world-methodology">

            <div class="methodology-title">
                데이터 산출 방법
            </div>


            <p>
                OECD 정부 연구개발 예산 배정(GBARD) 중
                NABS03 「우주 탐사 및 개발」 데이터를 사용합니다.
            </p>


            <p>
                원자료는 각 국가의 자국 통화 기준 백만 단위로 제공됩니다.
                각 국가의 원자료를 2026년 3월 31일 ECB 기준환율을 적용하여 USD million(미국 달러 백만 달러)으로 환산했습니다.  
                ${
                    worldSpaceData.exchange_rate_date ??
                    "-"
                }.
            </p>


            <p class="methodology-source">
                Source:
                OECD · ECB
            </p>

        </div>

    `;


    // =================================================
    // CHART
    // =================================================

    renderWorldSpaceChart(
        chartLabels,
        chartValues
    );

}


// =====================================================
// WORLD SPACE CHART
// =====================================================

function renderWorldSpaceChart(
    labels,
    values
) {

    const canvas =
        document.getElementById(
            "worldSpaceChart"
        );


    if (!canvas) {

        console.warn(
            "worldSpaceChart canvas not found"
        );

        return;

    }


    // 기존 차트 제거

    if (worldSpaceChart) {

        worldSpaceChart.destroy();

        worldSpaceChart = null;

    }


    worldSpaceChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label: "USD million",

                            data: values,

                            borderWidth: 1,

                            borderRadius: 8

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            display: false

                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function(context) {

                                        return (
                                            "$" +
                                            Number(
                                                context.raw
                                            ).toLocaleString(
                                                "en-US",
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                }
                                            ) +
                                            " million"
                                        );

                                    }

                            }

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            title: {

                                display: true,

                                text: "USD million"

                            },

                            ticks: {

                                callback:
                                    function(value) {

                                        return (
                                            "$" +
                                            Number(
                                                value
                                            ).toLocaleString(
                                                "en-US"
                                            )
                                        );

                                    }

                            }

                        },

                        x: {

                            grid: {

                                display: false

                            }

                        }

                    }

                }

            }
        );

}


// =====================================================
// WORLD SPACE AUTO UPDATE
// =====================================================

setInterval(
    loadWorldSpace,
    5 * 60 * 1000
);

loadWorldSpace();


// =====================================================
// OPTIONAL AUTO UPDATE
// 5 MINUTES
// =====================================================


// =====================================================
// EXPLORATION
// =====================================================

function formatMissionDate(value) {

    if (!value) return "발사일 미정";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "발사일 미정";

    return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });

}


function formatMissionStatus(value) {

    const translations = {
        "Go for Launch": "발사 진행 예정",
        "To Be Confirmed": "일정 확인 중",
        "To Be Determined": "일정 미정",
        "Launch Successful": "발사 성공",
        "Launch Failure": "발사 실패",
        "Hold": "발사 보류"
    };

    return translations[value] || value || "일정 확인 중";

}


function missionElement(tag, className, text) {

    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;

}


async function loadExploration() {

    const grid = document.getElementById("explorationGrid");
    const status = document.getElementById("explorationStatus");
    const source = document.getElementById("explorationSource");

    if (!grid) return;

    try {

        const data = await getJSON("exploration.json");
        const missions = Array.isArray(data.missions) ? data.missions : [];

        if (!missions.length) throw new Error("No exploration missions");

        grid.innerHTML = "";

        missions.forEach(mission => {

            const card = document.createElement("article");
            card.className = "exploration-card";

            const link = document.createElement("a");
            link.href = mission.url || "#";
            if (mission.url) {
                link.target = "_blank";
                link.rel = "noopener";
            }

            link.appendChild(missionElement("div", "exploration-icon", mission.icon || "🚀"));
            link.appendChild(missionElement("h3", "", mission.name || "이름 없는 미션"));
            link.appendChild(missionElement("p", "", mission.description || "임무 설명이 제공되지 않았습니다."));

            const meta = document.createElement("div");
            meta.className = "exploration-meta";
            meta.appendChild(missionElement("span", "exploration-agency", mission.agency || "기관 정보 없음"));
            meta.appendChild(missionElement("span", "", formatMissionDate(mission.launch_date)));

            card.appendChild(link);
            card.appendChild(meta);
            card.appendChild(missionElement("div", "exploration-info", formatMissionStatus(mission.status)));
            grid.appendChild(card);

        });

        const updated = data.updated_at ? formatMissionDate(data.updated_at) : "갱신 시각 없음";
        status.textContent = `예정 탐사 미션 ${missions.length}건 · ${updated} 기준`;

        if (source && data.source_url) {
            source.href = data.source_url;
            source.textContent = data.source || "데이터 출처";
        }

    } catch (error) {

        console.error("[EXPLORATION]", error);
        grid.innerHTML = "";
        grid.appendChild(missionElement("div", "status-message", "탐사 미션 데이터를 불러오지 못했습니다. 다음 수집 작업 후 다시 시도해 주세요."));
        if (status) status.textContent = "탐사 미션 데이터 갱신이 필요합니다.";

    }

}


// =====================================================
// NEO FILTER
// =====================================================

const neoDistance =
    document.getElementById(
        "neoDistance"
    );


const neoSize =
    document.getElementById(
        "neoSize"
    );


if (neoDistance) {

    neoDistance.addEventListener(
        "change",
        renderNEO
    );

}


if (neoSize) {

    neoSize.addEventListener(
        "change",
        renderNEO
    );

}


// =====================================================
// 전체 데이터 로딩
// =====================================================

async function loadAllData() {

    console.log(
        "🚀 SPACE DATA CENTER 데이터 로딩..."
    );


    const results =
        await Promise.allSettled([

            loadISS(),

            loadNEO(),

            loadSolar(),

            loadKoreaSpace(),

            loadWorldSpace(),

            loadExploration()

        ]);


    console.log(
        "데이터 로딩 완료:",
        results
    );

}


// =====================================================
// 실행
// =====================================================

loadAllData();
