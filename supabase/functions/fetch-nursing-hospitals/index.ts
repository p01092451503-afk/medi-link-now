// @deno-std v0.224.0 — updated 2026-03
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 건강보험심사평가원 요양기관정보서비스 API (요양병원 조회)
// API 문서: https://www.data.go.kr/data/15001698/openapi.do
const API_URL = "http://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList";

interface NursingHospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  type: string;
  beds?: number;
}

// Parse XML value helper
const getValue = (xml: string, tag: string): string => {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  const result = regex.exec(xml);
  return result ? result[1].trim() : '';
};

const getNumValue = (xml: string, tag: string): number => {
  const val = getValue(xml, tag);
  return val ? parseInt(val, 10) || 0 : 0;
};

const getFloatValue = (xml: string, tag: string): number => {
  const val = getValue(xml, tag);
  return val ? parseFloat(val) || 0 : 0;
};

// Comprehensive mock data for nursing hospitals across Korea (150+ hospitals)
const getMockNursingHospitals = (): NursingHospital[] => {
  return [
    // ===== 서울특별시 (15개) =====
    { id: 'nh-1', name: '서울요양병원', address: '서울특별시 강남구 테헤란로 123', phone: '02-1234-5678', lat: 37.5012, lng: 127.0396, type: '요양병원', beds: 150 },
    { id: 'nh-2', name: '강북요양병원', address: '서울특별시 강북구 도봉로 456', phone: '02-2345-6789', lat: 37.6396, lng: 127.0257, type: '요양병원', beds: 120 },
    { id: 'nh-3', name: '송파요양병원', address: '서울특별시 송파구 올림픽로 789', phone: '02-3456-7890', lat: 37.5145, lng: 127.1059, type: '요양병원', beds: 180 },
    { id: 'nh-4', name: '마포요양병원', address: '서울특별시 마포구 월드컵로 321', phone: '02-4567-8901', lat: 37.5665, lng: 126.9018, type: '요양병원', beds: 100 },
    { id: 'nh-5', name: '노원요양병원', address: '서울특별시 노원구 동일로 654', phone: '02-5678-9012', lat: 37.6542, lng: 127.0568, type: '요양병원', beds: 200 },
    { id: 'nh-6', name: '서초실버요양병원', address: '서울특별시 서초구 서초대로 111', phone: '02-6789-0123', lat: 37.4837, lng: 127.0324, type: '요양병원', beds: 180 },
    { id: 'nh-7', name: '영등포요양병원', address: '서울특별시 영등포구 국회대로 222', phone: '02-7890-1234', lat: 37.5260, lng: 126.8963, type: '요양병원', beds: 140 },
    { id: 'nh-8', name: '관악실버케어병원', address: '서울특별시 관악구 관악로 333', phone: '02-8901-2345', lat: 37.4783, lng: 126.9516, type: '요양병원', beds: 160 },
    { id: 'nh-9', name: '동대문효요양병원', address: '서울특별시 동대문구 천호대로 444', phone: '02-9012-3456', lat: 37.5744, lng: 127.0397, type: '요양병원', beds: 130 },
    { id: 'nh-10', name: '성북실버요양병원', address: '서울특별시 성북구 동소문로 555', phone: '02-0123-4567', lat: 37.5894, lng: 127.0167, type: '요양병원', beds: 110 },
    { id: 'nh-11', name: '중랑요양병원', address: '서울특별시 중랑구 망우로 666', phone: '02-1111-2222', lat: 37.5953, lng: 127.0857, type: '요양병원', beds: 170 },
    { id: 'nh-12', name: '금천실버요양병원', address: '서울특별시 금천구 시흥대로 777', phone: '02-2222-3333', lat: 37.4600, lng: 126.9008, type: '요양병원', beds: 90 },
    { id: 'nh-13', name: '구로효도요양병원', address: '서울특별시 구로구 디지털로 888', phone: '02-3333-4444', lat: 37.4854, lng: 126.8973, type: '요양병원', beds: 120 },
    { id: 'nh-14', name: '도봉산요양병원', address: '서울특별시 도봉구 도봉로 999', phone: '02-4444-5555', lat: 37.6688, lng: 127.0471, type: '요양병원', beds: 100 },
    { id: 'nh-15', name: '강서힐링요양병원', address: '서울특별시 강서구 화곡로 123', phone: '02-5555-6666', lat: 37.5509, lng: 126.8495, type: '요양병원', beds: 150 },

    // ===== 경기도 (25개) =====
    { id: 'nh-16', name: '수원요양병원', address: '경기도 수원시 팔달구 효원로 111', phone: '031-111-2222', lat: 37.2636, lng: 127.0286, type: '요양병원', beds: 250 },
    { id: 'nh-17', name: '성남요양병원', address: '경기도 성남시 분당구 정자일로 222', phone: '031-222-3333', lat: 37.3595, lng: 127.1086, type: '요양병원', beds: 180 },
    { id: 'nh-18', name: '고양요양병원', address: '경기도 고양시 일산동구 중앙로 333', phone: '031-333-4444', lat: 37.6580, lng: 126.7690, type: '요양병원', beds: 160 },
    { id: 'nh-19', name: '용인요양병원', address: '경기도 용인시 기흥구 동백죽전로 444', phone: '031-444-5555', lat: 37.2747, lng: 127.1150, type: '요양병원', beds: 140 },
    { id: 'nh-20', name: '안양요양병원', address: '경기도 안양시 동안구 평촌대로 555', phone: '031-555-6666', lat: 37.3943, lng: 126.9568, type: '요양병원', beds: 130 },
    { id: 'nh-21', name: '부천실버요양병원', address: '경기도 부천시 원미구 길주로 666', phone: '031-666-7777', lat: 37.5034, lng: 126.7660, type: '요양병원', beds: 200 },
    { id: 'nh-22', name: '화성요양병원', address: '경기도 화성시 동탄대로 777', phone: '031-777-8888', lat: 37.2065, lng: 127.0750, type: '요양병원', beds: 220 },
    { id: 'nh-23', name: '파주실버요양병원', address: '경기도 파주시 금촌로 888', phone: '031-888-9999', lat: 37.7599, lng: 126.7798, type: '요양병원', beds: 170 },
    { id: 'nh-24', name: '시흥요양병원', address: '경기도 시흥시 시흥대로 999', phone: '031-999-0000', lat: 37.3800, lng: 126.8030, type: '요양병원', beds: 150 },
    { id: 'nh-25', name: '광명효도요양병원', address: '경기도 광명시 광명로 111', phone: '031-100-2000', lat: 37.4786, lng: 126.8644, type: '요양병원', beds: 120 },
    { id: 'nh-26', name: '의정부요양병원', address: '경기도 의정부시 시민로 222', phone: '031-200-3000', lat: 37.7381, lng: 127.0337, type: '요양병원', beds: 180 },
    { id: 'nh-27', name: '남양주힐링요양병원', address: '경기도 남양주시 진접읍 금강로 333', phone: '031-300-4000', lat: 37.6867, lng: 127.1855, type: '요양병원', beds: 190 },
    { id: 'nh-28', name: '평택실버요양병원', address: '경기도 평택시 평택로 444', phone: '031-400-5000', lat: 36.9921, lng: 127.1127, type: '요양병원', beds: 160 },
    { id: 'nh-29', name: '안산요양병원', address: '경기도 안산시 단원구 광덕로 555', phone: '031-500-6000', lat: 37.3219, lng: 126.8309, type: '요양병원', beds: 140 },
    { id: 'nh-30', name: '김포요양병원', address: '경기도 김포시 김포대로 666', phone: '031-600-7000', lat: 37.6153, lng: 126.7156, type: '요양병원', beds: 130 },
    { id: 'nh-31', name: '광주시요양병원', address: '경기도 광주시 경충대로 777', phone: '031-700-8000', lat: 37.4095, lng: 127.2550, type: '요양병원', beds: 110 },
    { id: 'nh-32', name: '오산실버요양병원', address: '경기도 오산시 오산로 888', phone: '031-800-9000', lat: 37.1498, lng: 127.0690, type: '요양병원', beds: 100 },
    { id: 'nh-33', name: '하남요양병원', address: '경기도 하남시 미사대로 999', phone: '031-900-0000', lat: 37.5393, lng: 127.2147, type: '요양병원', beds: 170 },
    { id: 'nh-34', name: '군포실버케어병원', address: '경기도 군포시 산본로 111', phone: '031-101-2020', lat: 37.3616, lng: 126.9352, type: '요양병원', beds: 140 },
    { id: 'nh-35', name: '이천요양병원', address: '경기도 이천시 중리천로 222', phone: '031-202-3030', lat: 37.2792, lng: 127.4350, type: '요양병원', beds: 120 },
    { id: 'nh-36', name: '양주요양병원', address: '경기도 양주시 고읍남로 333', phone: '031-303-4040', lat: 37.7852, lng: 127.0456, type: '요양병원', beds: 100 },
    { id: 'nh-37', name: '구리힐링요양병원', address: '경기도 구리시 건원대로 444', phone: '031-404-5050', lat: 37.5943, lng: 127.1295, type: '요양병원', beds: 130 },
    { id: 'nh-38', name: '포천실버요양병원', address: '경기도 포천시 소흘읍 호국로 555', phone: '031-505-6060', lat: 37.8949, lng: 127.2003, type: '요양병원', beds: 90 },
    { id: 'nh-39', name: '양평요양병원', address: '경기도 양평군 양평읍 중앙로 666', phone: '031-606-7070', lat: 37.4917, lng: 127.4875, type: '요양병원', beds: 80 },
    { id: 'nh-40', name: '여주실버요양병원', address: '경기도 여주시 세종로 777', phone: '031-707-8080', lat: 37.2983, lng: 127.6367, type: '요양병원', beds: 110 },

    // ===== 인천광역시 (10개) =====
    { id: 'nh-41', name: '인천요양병원', address: '인천광역시 남동구 예술로 123', phone: '032-123-4567', lat: 37.4475, lng: 126.7052, type: '요양병원', beds: 200 },
    { id: 'nh-42', name: '송도요양병원', address: '인천광역시 연수구 송도동 456', phone: '032-234-5678', lat: 37.3830, lng: 126.6570, type: '요양병원', beds: 180 },
    { id: 'nh-43', name: '부평실버요양병원', address: '인천광역시 부평구 부평대로 789', phone: '032-345-6789', lat: 37.5075, lng: 126.7219, type: '요양병원', beds: 160 },
    { id: 'nh-44', name: '계양요양병원', address: '인천광역시 계양구 계양대로 321', phone: '032-456-7890', lat: 37.5370, lng: 126.7377, type: '요양병원', beds: 140 },
    { id: 'nh-45', name: '서구실버요양병원', address: '인천광역시 서구 검단로 654', phone: '032-567-8901', lat: 37.5457, lng: 126.6760, type: '요양병원', beds: 150 },
    { id: 'nh-46', name: '미추홀요양병원', address: '인천광역시 미추홀구 인하로 987', phone: '032-678-9012', lat: 37.4563, lng: 126.6505, type: '요양병원', beds: 170 },
    { id: 'nh-47', name: '동구효도요양병원', address: '인천광역시 동구 샛골로 111', phone: '032-789-0123', lat: 37.4739, lng: 126.6432, type: '요양병원', beds: 100 },
    { id: 'nh-48', name: '중구실버케어병원', address: '인천광역시 중구 제물량로 222', phone: '032-890-1234', lat: 37.4731, lng: 126.6215, type: '요양병원', beds: 90 },
    { id: 'nh-49', name: '청라요양병원', address: '인천광역시 서구 청라대로 333', phone: '032-901-2345', lat: 37.5350, lng: 126.6450, type: '요양병원', beds: 200 },
    { id: 'nh-50', name: '강화도실버요양병원', address: '인천광역시 강화군 강화읍 강화대로 444', phone: '032-012-3456', lat: 37.7467, lng: 126.4878, type: '요양병원', beds: 80 },

    // ===== 부산광역시 (12개) =====
    { id: 'nh-51', name: '부산요양병원', address: '부산광역시 해운대구 해운대로 789', phone: '051-789-0123', lat: 35.1631, lng: 129.1635, type: '요양병원', beds: 220 },
    { id: 'nh-52', name: '서면요양병원', address: '부산광역시 부산진구 서면로 321', phone: '051-890-1234', lat: 35.1577, lng: 129.0596, type: '요양병원', beds: 190 },
    { id: 'nh-53', name: '동래요양병원', address: '부산광역시 동래구 명륜로 654', phone: '051-901-2345', lat: 35.2047, lng: 129.0786, type: '요양병원', beds: 170 },
    { id: 'nh-54', name: '사상실버요양병원', address: '부산광역시 사상구 사상로 111', phone: '051-111-2222', lat: 35.1525, lng: 128.9829, type: '요양병원', beds: 160 },
    { id: 'nh-55', name: '남구효도요양병원', address: '부산광역시 남구 수영로 222', phone: '051-222-3333', lat: 35.1366, lng: 129.0845, type: '요양병원', beds: 140 },
    { id: 'nh-56', name: '북구실버케어병원', address: '부산광역시 북구 만덕대로 333', phone: '051-333-4444', lat: 35.1972, lng: 129.0313, type: '요양병원', beds: 150 },
    { id: 'nh-57', name: '사하요양병원', address: '부산광역시 사하구 다대로 444', phone: '051-444-5555', lat: 35.1046, lng: 128.9750, type: '요양병원', beds: 180 },
    { id: 'nh-58', name: '강서힐링요양병원', address: '부산광역시 강서구 명지오션시티로 555', phone: '051-555-6666', lat: 35.1047, lng: 128.9324, type: '요양병원', beds: 200 },
    { id: 'nh-59', name: '연제요양병원', address: '부산광역시 연제구 연산로 666', phone: '051-666-7777', lat: 35.1760, lng: 129.0798, type: '요양병원', beds: 130 },
    { id: 'nh-60', name: '금정실버요양병원', address: '부산광역시 금정구 금정로 777', phone: '051-777-8888', lat: 35.2428, lng: 129.0922, type: '요양병원', beds: 120 },
    { id: 'nh-61', name: '기장요양병원', address: '부산광역시 기장군 기장읍 기장대로 888', phone: '051-888-9999', lat: 35.2445, lng: 129.2222, type: '요양병원', beds: 110 },
    { id: 'nh-62', name: '수영실버요양병원', address: '부산광역시 수영구 수영로 999', phone: '051-999-0000', lat: 35.1457, lng: 129.1133, type: '요양병원', beds: 140 },

    // ===== 대구광역시 (10개) =====
    { id: 'nh-63', name: '대구요양병원', address: '대구광역시 수성구 동대구로 111', phone: '053-111-2222', lat: 35.8563, lng: 128.6294, type: '요양병원', beds: 200 },
    { id: 'nh-64', name: '달서요양병원', address: '대구광역시 달서구 달구벌대로 222', phone: '053-222-3333', lat: 35.8282, lng: 128.5330, type: '요양병원', beds: 160 },
    { id: 'nh-65', name: '북구실버요양병원', address: '대구광역시 북구 옥산로 333', phone: '053-333-4444', lat: 35.8858, lng: 128.5828, type: '요양병원', beds: 170 },
    { id: 'nh-66', name: '동구효도요양병원', address: '대구광역시 동구 아양로 444', phone: '053-444-5555', lat: 35.8700, lng: 128.6350, type: '요양병원', beds: 140 },
    { id: 'nh-67', name: '서구실버케어병원', address: '대구광역시 서구 국채보상로 555', phone: '053-555-6666', lat: 35.8714, lng: 128.5592, type: '요양병원', beds: 130 },
    { id: 'nh-68', name: '남구요양병원', address: '대구광역시 남구 봉덕로 666', phone: '053-666-7777', lat: 35.8460, lng: 128.5970, type: '요양병원', beds: 150 },
    { id: 'nh-69', name: '달성요양병원', address: '대구광역시 달성군 다사읍 달구벌대로 777', phone: '053-777-8888', lat: 35.8526, lng: 128.4667, type: '요양병원', beds: 180 },
    { id: 'nh-70', name: '중구실버요양병원', address: '대구광역시 중구 달구벌대로 888', phone: '053-888-9999', lat: 35.8668, lng: 128.5938, type: '요양병원', beds: 100 },
    { id: 'nh-71', name: '수성힐링요양병원', address: '대구광역시 수성구 범어로 999', phone: '053-999-0000', lat: 35.8580, lng: 128.6180, type: '요양병원', beds: 190 },
    { id: 'nh-72', name: '경북대학요양병원', address: '대구광역시 북구 대학로 111', phone: '053-100-2000', lat: 35.8908, lng: 128.6104, type: '요양병원', beds: 220 },

    // ===== 대전광역시 (8개) =====
    { id: 'nh-73', name: '대전요양병원', address: '대전광역시 서구 둔산로 333', phone: '042-333-4444', lat: 36.3504, lng: 127.3845, type: '요양병원', beds: 180 },
    { id: 'nh-74', name: '유성요양병원', address: '대전광역시 유성구 대학로 444', phone: '042-444-5555', lat: 36.3623, lng: 127.3562, type: '요양병원', beds: 150 },
    { id: 'nh-75', name: '동구실버요양병원', address: '대전광역시 동구 동서대로 555', phone: '042-555-6666', lat: 36.3119, lng: 127.4548, type: '요양병원', beds: 140 },
    { id: 'nh-76', name: '중구효도요양병원', address: '대전광역시 중구 대종로 666', phone: '042-666-7777', lat: 36.3253, lng: 127.4216, type: '요양병원', beds: 130 },
    { id: 'nh-77', name: '대덕실버케어병원', address: '대전광역시 대덕구 한밭대로 777', phone: '042-777-8888', lat: 36.3467, lng: 127.4156, type: '요양병원', beds: 160 },
    { id: 'nh-78', name: '서구힐링요양병원', address: '대전광역시 서구 계룡로 888', phone: '042-888-9999', lat: 36.3541, lng: 127.3687, type: '요양병원', beds: 170 },
    { id: 'nh-79', name: '노은요양병원', address: '대전광역시 유성구 노은로 999', phone: '042-999-0000', lat: 36.3680, lng: 127.3180, type: '요양병원', beds: 120 },
    { id: 'nh-80', name: '관저실버요양병원', address: '대전광역시 서구 관저로 111', phone: '042-100-2000', lat: 36.3108, lng: 127.3355, type: '요양병원', beds: 140 },

    // ===== 광주광역시 (8개) =====
    { id: 'nh-81', name: '광주요양병원', address: '광주광역시 서구 상무대로 555', phone: '062-555-6666', lat: 35.1469, lng: 126.8512, type: '요양병원', beds: 170 },
    { id: 'nh-82', name: '북구요양병원', address: '광주광역시 북구 용봉로 666', phone: '062-666-7777', lat: 35.1733, lng: 126.9127, type: '요양병원', beds: 140 },
    { id: 'nh-83', name: '남구실버요양병원', address: '광주광역시 남구 봉선로 777', phone: '062-777-8888', lat: 35.1334, lng: 126.9023, type: '요양병원', beds: 150 },
    { id: 'nh-84', name: '동구효도요양병원', address: '광주광역시 동구 금남로 888', phone: '062-888-9999', lat: 35.1459, lng: 126.9234, type: '요양병원', beds: 120 },
    { id: 'nh-85', name: '광산실버케어병원', address: '광주광역시 광산구 광산로 999', phone: '062-999-0000', lat: 35.1395, lng: 126.7936, type: '요양병원', beds: 180 },
    { id: 'nh-86', name: '첨단요양병원', address: '광주광역시 광산구 첨단로 111', phone: '062-100-2000', lat: 35.2186, lng: 126.8469, type: '요양병원', beds: 200 },
    { id: 'nh-87', name: '수완힐링요양병원', address: '광주광역시 광산구 수완로 222', phone: '062-200-3000', lat: 35.1898, lng: 126.8245, type: '요양병원', beds: 160 },
    { id: 'nh-88', name: '운남실버요양병원', address: '광주광역시 광산구 운남로 333', phone: '062-300-4000', lat: 35.1756, lng: 126.7812, type: '요양병원', beds: 130 },

    // ===== 울산광역시 (6개) =====
    { id: 'nh-89', name: '울산요양병원', address: '울산광역시 남구 삼산로 777', phone: '052-777-8888', lat: 35.5384, lng: 129.3114, type: '요양병원', beds: 160 },
    { id: 'nh-90', name: '중구실버요양병원', address: '울산광역시 중구 번영로 888', phone: '052-888-9999', lat: 35.5684, lng: 129.3328, type: '요양병원', beds: 140 },
    { id: 'nh-91', name: '동구효도요양병원', address: '울산광역시 동구 방어로 999', phone: '052-999-0000', lat: 35.5049, lng: 129.4168, type: '요양병원', beds: 120 },
    { id: 'nh-92', name: '북구실버케어병원', address: '울산광역시 북구 진장유통로 111', phone: '052-100-2000', lat: 35.5821, lng: 129.3612, type: '요양병원', beds: 150 },
    { id: 'nh-93', name: '울주요양병원', address: '울산광역시 울주군 언양읍 언양로 222', phone: '052-200-3000', lat: 35.5621, lng: 129.1195, type: '요양병원', beds: 130 },
    { id: 'nh-94', name: '태화강요양병원', address: '울산광역시 중구 태화로 333', phone: '052-300-4000', lat: 35.5556, lng: 129.3167, type: '요양병원', beds: 170 },

    // ===== 세종특별자치시 (4개) =====
    { id: 'nh-95', name: '세종요양병원', address: '세종특별자치시 한누리대로 888', phone: '044-888-9999', lat: 36.4800, lng: 127.2890, type: '요양병원', beds: 120 },
    { id: 'nh-96', name: '조치원실버요양병원', address: '세종특별자치시 조치원읍 죽림로 111', phone: '044-100-2000', lat: 36.6039, lng: 127.2986, type: '요양병원', beds: 100 },
    { id: 'nh-97', name: '도담효도요양병원', address: '세종특별자치시 도담동 도담로 222', phone: '044-200-3000', lat: 36.5100, lng: 127.2600, type: '요양병원', beds: 140 },
    { id: 'nh-98', name: '아름실버케어병원', address: '세종특별자치시 아름동 아름로 333', phone: '044-300-4000', lat: 36.4950, lng: 127.2450, type: '요양병원', beds: 110 },

    // ===== 강원도 (10개) =====
    { id: 'nh-99', name: '춘천요양병원', address: '강원도 춘천시 중앙로 111', phone: '033-111-2222', lat: 37.8813, lng: 127.7298, type: '요양병원', beds: 130 },
    { id: 'nh-100', name: '원주요양병원', address: '강원도 원주시 시청로 222', phone: '033-222-3333', lat: 37.3422, lng: 127.9202, type: '요양병원', beds: 140 },
    { id: 'nh-101', name: '강릉요양병원', address: '강원도 강릉시 경강로 333', phone: '033-333-4444', lat: 37.7519, lng: 128.8760, type: '요양병원', beds: 110 },
    { id: 'nh-102', name: '속초실버요양병원', address: '강원도 속초시 중앙로 444', phone: '033-444-5555', lat: 38.2070, lng: 128.5918, type: '요양병원', beds: 90 },
    { id: 'nh-103', name: '동해효도요양병원', address: '강원도 동해시 천곡로 555', phone: '033-555-6666', lat: 37.5246, lng: 129.1143, type: '요양병원', beds: 100 },
    { id: 'nh-104', name: '삼척실버케어병원', address: '강원도 삼척시 중앙로 666', phone: '033-666-7777', lat: 37.4499, lng: 129.1652, type: '요양병원', beds: 80 },
    { id: 'nh-105', name: '태백요양병원', address: '강원도 태백시 황지로 777', phone: '033-777-8888', lat: 37.1640, lng: 128.9856, type: '요양병원', beds: 70 },
    { id: 'nh-106', name: '홍천실버요양병원', address: '강원도 홍천군 홍천읍 홍천로 888', phone: '033-888-9999', lat: 37.6966, lng: 127.8889, type: '요양병원', beds: 100 },
    { id: 'nh-107', name: '횡성요양병원', address: '강원도 횡성군 횡성읍 문화체육로 999', phone: '033-999-0000', lat: 37.4917, lng: 127.9850, type: '요양병원', beds: 90 },
    { id: 'nh-108', name: '정선힐링요양병원', address: '강원도 정선군 정선읍 봉양로 111', phone: '033-100-2000', lat: 37.3805, lng: 128.6608, type: '요양병원', beds: 80 },

    // ===== 충청북도 (8개) =====
    { id: 'nh-109', name: '청주요양병원', address: '충청북도 청주시 상당구 상당로 444', phone: '043-444-5555', lat: 36.6424, lng: 127.4890, type: '요양병원', beds: 150 },
    { id: 'nh-110', name: '충주요양병원', address: '충청북도 충주시 성서동 555', phone: '043-555-6666', lat: 36.9910, lng: 127.9259, type: '요양병원', beds: 120 },
    { id: 'nh-111', name: '제천실버요양병원', address: '충청북도 제천시 의림대로 666', phone: '043-666-7777', lat: 37.1326, lng: 128.1910, type: '요양병원', beds: 110 },
    { id: 'nh-112', name: '음성효도요양병원', address: '충청북도 음성군 음성읍 중앙로 777', phone: '043-777-8888', lat: 36.9399, lng: 127.6908, type: '요양병원', beds: 90 },
    { id: 'nh-113', name: '진천실버케어병원', address: '충청북도 진천군 진천읍 중앙북로 888', phone: '043-888-9999', lat: 36.8554, lng: 127.4363, type: '요양병원', beds: 100 },
    { id: 'nh-114', name: '옥천요양병원', address: '충청북도 옥천군 옥천읍 금장로 999', phone: '043-999-0000', lat: 36.3062, lng: 127.5714, type: '요양병원', beds: 80 },
    { id: 'nh-115', name: '영동실버요양병원', address: '충청북도 영동군 영동읍 중앙로 111', phone: '043-100-2000', lat: 36.1749, lng: 127.7835, type: '요양병원', beds: 70 },
    { id: 'nh-116', name: '증평힐링요양병원', address: '충청북도 증평군 증평읍 증평로 222', phone: '043-200-3000', lat: 36.7855, lng: 127.5816, type: '요양병원', beds: 90 },

    // ===== 충청남도 (10개) =====
    { id: 'nh-117', name: '천안요양병원', address: '충청남도 천안시 동남구 만남로 666', phone: '041-666-7777', lat: 36.8151, lng: 127.1139, type: '요양병원', beds: 180 },
    { id: 'nh-118', name: '아산요양병원', address: '충청남도 아산시 온천로 777', phone: '041-777-8888', lat: 36.7898, lng: 127.0047, type: '요양병원', beds: 140 },
    { id: 'nh-119', name: '서산실버요양병원', address: '충청남도 서산시 중앙로 888', phone: '041-888-9999', lat: 36.7845, lng: 126.4503, type: '요양병원', beds: 120 },
    { id: 'nh-120', name: '논산효도요양병원', address: '충청남도 논산시 시민로 999', phone: '041-999-0000', lat: 36.1872, lng: 127.0987, type: '요양병원', beds: 130 },
    { id: 'nh-121', name: '공주실버케어병원', address: '충청남도 공주시 웅진로 111', phone: '041-100-2000', lat: 36.4465, lng: 127.1190, type: '요양병원', beds: 110 },
    { id: 'nh-122', name: '보령요양병원', address: '충청남도 보령시 대천로 222', phone: '041-200-3000', lat: 36.3334, lng: 126.6128, type: '요양병원', beds: 100 },
    { id: 'nh-123', name: '당진실버요양병원', address: '충청남도 당진시 당진중앙로 333', phone: '041-300-4000', lat: 36.8898, lng: 126.6295, type: '요양병원', beds: 130 },
    { id: 'nh-124', name: '홍성효도요양병원', address: '충청남도 홍성군 홍성읍 중앙로 444', phone: '041-400-5000', lat: 36.6012, lng: 126.6604, type: '요양병원', beds: 90 },
    { id: 'nh-125', name: '예산힐링요양병원', address: '충청남도 예산군 예산읍 천변로 555', phone: '041-500-6000', lat: 36.6826, lng: 126.8487, type: '요양병원', beds: 100 },
    { id: 'nh-126', name: '계룡실버요양병원', address: '충청남도 계룡시 계룡대로 666', phone: '041-600-7000', lat: 36.2746, lng: 127.2487, type: '요양병원', beds: 110 },

    // ===== 전라북도 (8개) =====
    { id: 'nh-127', name: '전주요양병원', address: '전라북도 전주시 완산구 전주천로 888', phone: '063-888-9999', lat: 35.8242, lng: 127.1480, type: '요양병원', beds: 170 },
    { id: 'nh-128', name: '익산요양병원', address: '전라북도 익산시 무왕로 999', phone: '063-999-0000', lat: 35.9483, lng: 126.9576, type: '요양병원', beds: 130 },
    { id: 'nh-129', name: '군산실버요양병원', address: '전라북도 군산시 수송로 111', phone: '063-100-2000', lat: 35.9676, lng: 126.7369, type: '요양병원', beds: 140 },
    { id: 'nh-130', name: '정읍효도요양병원', address: '전라북도 정읍시 충정로 222', phone: '063-200-3000', lat: 35.5699, lng: 126.8560, type: '요양병원', beds: 100 },
    { id: 'nh-131', name: '남원실버케어병원', address: '전라북도 남원시 용성로 333', phone: '063-300-4000', lat: 35.4163, lng: 127.3903, type: '요양병원', beds: 90 },
    { id: 'nh-132', name: '김제요양병원', address: '전라북도 김제시 요촌로 444', phone: '063-400-5000', lat: 35.8038, lng: 126.8809, type: '요양병원', beds: 110 },
    { id: 'nh-133', name: '완주힐링요양병원', address: '전라북도 완주군 봉동읍 완주로 555', phone: '063-500-6000', lat: 35.8446, lng: 127.1428, type: '요양병원', beds: 120 },
    { id: 'nh-134', name: '고창실버요양병원', address: '전라북도 고창군 고창읍 읍내로 666', phone: '063-600-7000', lat: 35.4358, lng: 126.7019, type: '요양병원', beds: 80 },

    // ===== 전라남도 (10개) =====
    { id: 'nh-135', name: '목포요양병원', address: '전라남도 목포시 평화로 111', phone: '061-111-2222', lat: 34.8118, lng: 126.3922, type: '요양병원', beds: 140 },
    { id: 'nh-136', name: '순천요양병원', address: '전라남도 순천시 장천로 222', phone: '061-222-3333', lat: 34.9506, lng: 127.4872, type: '요양병원', beds: 150 },
    { id: 'nh-137', name: '여수요양병원', address: '전라남도 여수시 좌수영로 333', phone: '061-333-4444', lat: 34.7604, lng: 127.6622, type: '요양병원', beds: 120 },
    { id: 'nh-138', name: '광양실버요양병원', address: '전라남도 광양시 광양읍 칠성로 444', phone: '061-444-5555', lat: 34.9407, lng: 127.5857, type: '요양병원', beds: 130 },
    { id: 'nh-139', name: '나주효도요양병원', address: '전라남도 나주시 죽림길 555', phone: '061-555-6666', lat: 35.0159, lng: 126.7110, type: '요양병원', beds: 110 },
    { id: 'nh-140', name: '무안실버케어병원', address: '전라남도 무안군 무안읍 무안로 666', phone: '061-666-7777', lat: 34.9905, lng: 126.4815, type: '요양병원', beds: 100 },
    { id: 'nh-141', name: '해남요양병원', address: '전라남도 해남군 해남읍 중앙로 777', phone: '061-777-8888', lat: 34.5736, lng: 126.5990, type: '요양병원', beds: 90 },
    { id: 'nh-142', name: '영암실버요양병원', address: '전라남도 영암군 영암읍 동무로 888', phone: '061-888-9999', lat: 34.8002, lng: 126.6981, type: '요양병원', beds: 80 },
    { id: 'nh-143', name: '담양힐링요양병원', address: '전라남도 담양군 담양읍 추월로 999', phone: '061-999-0000', lat: 35.3214, lng: 126.9884, type: '요양병원', beds: 100 },
    { id: 'nh-144', name: '장성실버요양병원', address: '전라남도 장성군 장성읍 중앙로 111', phone: '061-100-2000', lat: 35.3020, lng: 126.7849, type: '요양병원', beds: 90 },

    // ===== 경상북도 (10개) =====
    { id: 'nh-145', name: '포항요양병원', address: '경상북도 포항시 남구 새천년대로 444', phone: '054-444-5555', lat: 36.0190, lng: 129.3435, type: '요양병원', beds: 160 },
    { id: 'nh-146', name: '경주요양병원', address: '경상북도 경주시 태종로 555', phone: '054-555-6666', lat: 35.8562, lng: 129.2247, type: '요양병원', beds: 130 },
    { id: 'nh-147', name: '구미요양병원', address: '경상북도 구미시 송정대로 666', phone: '054-666-7777', lat: 36.1195, lng: 128.3446, type: '요양병원', beds: 140 },
    { id: 'nh-148', name: '안동실버요양병원', address: '경상북도 안동시 경동로 777', phone: '054-777-8888', lat: 36.5684, lng: 128.7294, type: '요양병원', beds: 120 },
    { id: 'nh-149', name: '김천효도요양병원', address: '경상북도 김천시 평화로 888', phone: '054-888-9999', lat: 36.1398, lng: 128.1136, type: '요양병원', beds: 110 },
    { id: 'nh-150', name: '영주실버케어병원', address: '경상북도 영주시 광복로 999', phone: '054-999-0000', lat: 36.8057, lng: 128.6240, type: '요양병원', beds: 100 },
    { id: 'nh-151', name: '상주요양병원', address: '경상북도 상주시 상주로 111', phone: '054-100-2000', lat: 36.4110, lng: 128.1590, type: '요양병원', beds: 90 },
    { id: 'nh-152', name: '문경실버요양병원', address: '경상북도 문경시 문경대로 222', phone: '054-200-3000', lat: 36.5867, lng: 128.1867, type: '요양병원', beds: 80 },
    { id: 'nh-153', name: '경산힐링요양병원', address: '경상북도 경산시 중앙로 333', phone: '054-300-4000', lat: 35.8251, lng: 128.7414, type: '요양병원', beds: 150 },
    { id: 'nh-154', name: '칠곡실버요양병원', address: '경상북도 칠곡군 왜관읍 왜관로 444', phone: '054-400-5000', lat: 35.9734, lng: 128.4013, type: '요양병원', beds: 110 },

    // ===== 경상남도 (10개) =====
    { id: 'nh-155', name: '창원요양병원', address: '경상남도 창원시 성산구 중앙대로 777', phone: '055-777-8888', lat: 35.2275, lng: 128.6819, type: '요양병원', beds: 200 },
    { id: 'nh-156', name: '김해요양병원', address: '경상남도 김해시 김해대로 888', phone: '055-888-9999', lat: 35.2341, lng: 128.8890, type: '요양병원', beds: 160 },
    { id: 'nh-157', name: '진주요양병원', address: '경상남도 진주시 진주대로 999', phone: '055-999-0000', lat: 35.1801, lng: 128.1076, type: '요양병원', beds: 150 },
    { id: 'nh-158', name: '양산실버요양병원', address: '경상남도 양산시 중앙로 111', phone: '055-100-2000', lat: 35.3350, lng: 129.0372, type: '요양병원', beds: 170 },
    { id: 'nh-159', name: '거제효도요양병원', address: '경상남도 거제시 중앙로 222', phone: '055-200-3000', lat: 34.8808, lng: 128.6211, type: '요양병원', beds: 120 },
    { id: 'nh-160', name: '통영실버케어병원', address: '경상남도 통영시 광도면 죽림로 333', phone: '055-300-4000', lat: 34.8545, lng: 128.4330, type: '요양병원', beds: 110 },
    { id: 'nh-161', name: '사천요양병원', address: '경상남도 사천시 용현면 사천대로 444', phone: '055-400-5000', lat: 35.0037, lng: 128.0647, type: '요양병원', beds: 100 },
    { id: 'nh-162', name: '밀양실버요양병원', address: '경상남도 밀양시 중앙로 555', phone: '055-500-6000', lat: 35.5037, lng: 128.7464, type: '요양병원', beds: 130 },
    { id: 'nh-163', name: '함안힐링요양병원', address: '경상남도 함안군 가야읍 함안대로 666', phone: '055-600-7000', lat: 35.2726, lng: 128.4066, type: '요양병원', beds: 90 },
    { id: 'nh-164', name: '창녕실버요양병원', address: '경상남도 창녕군 창녕읍 창녕대로 777', phone: '055-700-8000', lat: 35.5427, lng: 128.4922, type: '요양병원', beds: 80 },

    // ===== 제주특별자치도 (6개) =====
    { id: 'nh-165', name: '제주요양병원', address: '제주특별자치도 제주시 중앙로 111', phone: '064-111-2222', lat: 33.4996, lng: 126.5312, type: '요양병원', beds: 180 },
    { id: 'nh-166', name: '서귀포요양병원', address: '제주특별자치도 서귀포시 중앙로 222', phone: '064-222-3333', lat: 33.2541, lng: 126.5603, type: '요양병원', beds: 140 },
    { id: 'nh-167', name: '애월실버요양병원', address: '제주특별자치도 제주시 애월읍 애월로 333', phone: '064-333-4444', lat: 33.4628, lng: 126.3271, type: '요양병원', beds: 100 },
    { id: 'nh-168', name: '조천효도요양병원', address: '제주특별자치도 제주시 조천읍 조천로 444', phone: '064-444-5555', lat: 33.5400, lng: 126.6400, type: '요양병원', beds: 90 },
    { id: 'nh-169', name: '성산실버케어병원', address: '제주특별자치도 서귀포시 성산읍 성산로 555', phone: '064-555-6666', lat: 33.4362, lng: 126.9145, type: '요양병원', beds: 80 },
    { id: 'nh-170', name: '중문힐링요양병원', address: '제주특별자치도 서귀포시 중문관광로 666', phone: '064-666-7777', lat: 33.2542, lng: 126.4107, type: '요양병원', beds: 120 },
  ];
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceKey = Deno.env.get('PUBLIC_DATA_PORTAL_KEY');
    
    // Get query parameters
    const url = new URL(req.url);
    const pageNo = url.searchParams.get('pageNo') || '1';
    const numOfRows = url.searchParams.get('numOfRows') || '1000';
    const useMock = url.searchParams.get('useMock') === 'true';

    console.log(`Fetching nursing hospitals: pageNo=${pageNo}, numOfRows=${numOfRows}`);

    // If no API key or useMock is true, return mock data
    if (!serviceKey || useMock) {
      console.log('Using mock nursing hospital data (no API key or mock requested)');
      const mockData = getMockNursingHospitals();
      return new Response(
        JSON.stringify({
          success: true,
          data: mockData,
          totalCount: mockData.length,
          pageNo: 1,
          numOfRows: mockData.length,
          source: 'mock',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to fetch from API - 요양병원(clCd=31)
    const isAlreadyEncoded = serviceKey.includes('%');
    const encodedKey = isAlreadyEncoded ? serviceKey : encodeURIComponent(serviceKey);

    // clCd=31 is for 요양병원 (nursing hospitals)
    const apiUrl = `${API_URL}?serviceKey=${encodedKey}&pageNo=${pageNo}&numOfRows=${numOfRows}&clCd=31`;

    console.log('API URL:', apiUrl.replace(encodedKey, 'HIDDEN'));

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/xml',
      },
    });

    if (!response.ok) {
      console.error('API request failed:', response.status, await response.text());
      // Fall back to mock data on API failure
      console.log('Falling back to mock data due to API error');
      const mockData = getMockNursingHospitals();
      return new Response(
        JSON.stringify({
          success: true,
          data: mockData,
          totalCount: mockData.length,
          pageNo: 1,
          numOfRows: mockData.length,
          source: 'mock',
          apiError: `API returned ${response.status}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const xmlText = await response.text();
    console.log('Response length:', xmlText.length);
    console.log('Response preview:', xmlText.substring(0, 500));

    // Check for API error
    if (xmlText.includes('<errMsg>')) {
      const errMsg = getValue(xmlText, 'errMsg');
      console.error('API Error:', errMsg);
      // Fall back to mock data
      const mockData = getMockNursingHospitals();
      return new Response(
        JSON.stringify({
          success: true,
          data: mockData,
          totalCount: mockData.length,
          pageNo: 1,
          numOfRows: mockData.length,
          source: 'mock',
          apiError: errMsg,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse hospital items
    const hospitals: NursingHospital[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const item = match[1];
      
      // Parse coordinates - API uses xPos/yPos or XPos/YPos
      const lat = getFloatValue(item, 'YPos') || getFloatValue(item, 'yPos') || getFloatValue(item, 'wgs84Lat');
      const lng = getFloatValue(item, 'XPos') || getFloatValue(item, 'xPos') || getFloatValue(item, 'wgs84Lon');
      
      // Skip if no valid coordinates (within South Korea bounds)
      if (!lat || !lng || lat < 33 || lat > 39 || lng < 124 || lng > 132) {
        continue;
      }

      const hospital: NursingHospital = {
        id: getValue(item, 'ykiho') || getValue(item, 'hpid') || `nh-api-${hospitals.length}`,
        name: getValue(item, 'yadmNm') || getValue(item, 'dutyName') || '알 수 없음',
        address: getValue(item, 'addr') || getValue(item, 'dutyAddr') || '',
        phone: getValue(item, 'telno') || getValue(item, 'dutyTel1') || '',
        lat,
        lng,
        type: '요양병원',
        beds: getNumValue(item, 'cmdcGdrCnt') || getNumValue(item, 'hospBdCnt') || 0,
      };

      hospitals.push(hospital);
    }

    console.log(`Parsed ${hospitals.length} nursing hospitals from API`);

    // If no hospitals found from API, use mock data
    if (hospitals.length === 0) {
      console.log('No hospitals from API, using mock data');
      const mockData = getMockNursingHospitals();
      return new Response(
        JSON.stringify({
          success: true,
          data: mockData,
          totalCount: mockData.length,
          pageNo: 1,
          numOfRows: mockData.length,
          source: 'mock',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get total count from response
    const totalCount = getNumValue(xmlText, 'totalCount') || hospitals.length;

    return new Response(
      JSON.stringify({
        success: true,
        data: hospitals,
        totalCount,
        pageNo: parseInt(pageNo),
        numOfRows: parseInt(numOfRows),
        source: 'api',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error fetching nursing hospitals:', error);
    // Fall back to mock data on any error
    const mockData = getMockNursingHospitals();
    return new Response(
      JSON.stringify({
        success: true,
        data: mockData,
        totalCount: mockData.length,
        pageNo: 1,
        numOfRows: mockData.length,
        source: 'mock',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
