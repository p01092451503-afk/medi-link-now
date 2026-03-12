// @deno-std v0.224.0 — updated 2026-03
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ALLOWED_ORIGINS = [
  'https://find-er.kr',
  'https://www.find-er.kr',
  'https://find-bed-now.lovable.app',
  'https://id-preview--0014984b-817e-4711-bddc-15810d8fceb9.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// 국립중앙의료원 전국 약국 정보 조회 서비스 API
const API_URL = "http://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire";

interface HolidayPharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  mondayOpen?: string;
  mondayClose?: string;
  holidayOpen?: string;
  holidayClose?: string;
}

// Parse XML value helper
const getValue = (xml: string, tag: string): string => {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  const result = regex.exec(xml);
  return result ? result[1].trim() : '';
};

const getFloatValue = (xml: string, tag: string): number => {
  const val = getValue(xml, tag);
  return val ? parseFloat(val) || 0 : 0;
};

// Comprehensive mock data for holiday pharmacies across Korea (200+ pharmacies)
const getMockHolidayPharmacies = (): HolidayPharmacy[] => {
  return [
    // ===== 서울특별시 (40개) =====
    { id: 'hp-1', name: '24시온누리약국', address: '서울특별시 강남구 테헤란로 152', phone: '02-555-1234', lat: 37.5005, lng: 127.0367, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-2', name: '휴일지킴이약국', address: '서울특별시 종로구 종로 33', phone: '02-723-4567', lat: 37.5704, lng: 126.9922, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-3', name: '명동온누리약국', address: '서울특별시 중구 명동길 14', phone: '02-776-8901', lat: 37.5636, lng: 126.9869, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-4', name: '강서휴일약국', address: '서울특별시 강서구 공항대로 168', phone: '02-2659-2345', lat: 37.5580, lng: 126.8358, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-5', name: '노원24시약국', address: '서울특별시 노원구 동일로 1414', phone: '02-932-6789', lat: 37.6555, lng: 127.0620, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-6', name: '송파휴일약국', address: '서울특별시 송파구 올림픽로 300', phone: '02-421-3456', lat: 37.5107, lng: 127.0827, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-7', name: '마포온누리약국', address: '서울특별시 마포구 월드컵북로 21', phone: '02-332-7890', lat: 37.5571, lng: 126.9069, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-8', name: '영등포휴일약국', address: '서울특별시 영등포구 당산로 123', phone: '02-2636-1234', lat: 37.5347, lng: 126.8963, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-9', name: '서초24시약국', address: '서울특별시 서초구 서초대로 256', phone: '02-532-5678', lat: 37.4920, lng: 127.0276, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-10', name: '관악휴일약국', address: '서울특별시 관악구 관악로 145', phone: '02-876-9012', lat: 37.4783, lng: 126.9516, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-11', name: '동대문온누리약국', address: '서울특별시 동대문구 천호대로 321', phone: '02-967-3456', lat: 37.5744, lng: 127.0397, holidayOpen: '10:00', holidayClose: '18:00' },
    { id: 'hp-12', name: '성북휴일약국', address: '서울특별시 성북구 동소문로 112', phone: '02-921-7890', lat: 37.5894, lng: 127.0167, holidayOpen: '09:00', holidayClose: '16:00' },
    { id: 'hp-13', name: '중랑24시약국', address: '서울특별시 중랑구 망우로 234', phone: '02-435-2345', lat: 37.5953, lng: 127.0857, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-14', name: '금천온누리약국', address: '서울특별시 금천구 시흥대로 456', phone: '02-893-6789', lat: 37.4600, lng: 126.9008, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-15', name: '구로휴일약국', address: '서울특별시 구로구 디지털로 567', phone: '02-857-1234', lat: 37.4854, lng: 126.8973, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-16', name: '도봉산약국', address: '서울특별시 도봉구 도봉로 678', phone: '02-954-5678', lat: 37.6688, lng: 127.0471, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-17', name: '강동24시약국', address: '서울특별시 강동구 천호대로 789', phone: '02-481-9012', lat: 37.5301, lng: 127.1238, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-18', name: '양천온누리약국', address: '서울특별시 양천구 목동로 123', phone: '02-2644-3456', lat: 37.5170, lng: 126.8667, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-19', name: '은평휴일약국', address: '서울특별시 은평구 통일로 234', phone: '02-385-7890', lat: 37.6176, lng: 126.9227, holidayOpen: '10:00', holidayClose: '18:00' },
    { id: 'hp-20', name: '광진24시약국', address: '서울특별시 광진구 광나루로 345', phone: '02-456-2345', lat: 37.5384, lng: 127.0822, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-21', name: '용산휴일약국', address: '서울특별시 용산구 이태원로 456', phone: '02-792-6789', lat: 37.5311, lng: 126.9810, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-22', name: '강북온누리약국', address: '서울특별시 강북구 도봉로 567', phone: '02-987-1234', lat: 37.6396, lng: 127.0257, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-23', name: '서대문24시약국', address: '서울특별시 서대문구 연세로 678', phone: '02-312-5678', lat: 37.5593, lng: 126.9367, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-24', name: '동작휴일약국', address: '서울특별시 동작구 동작대로 789', phone: '02-823-9012', lat: 37.5124, lng: 126.9393, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-25', name: '삼성역약국', address: '서울특별시 강남구 삼성로 100', phone: '02-562-3456', lat: 37.5088, lng: 127.0631, holidayOpen: '09:00', holidayClose: '20:00' },
    { id: 'hp-26', name: '잠실24시약국', address: '서울특별시 송파구 올림픽로 435', phone: '02-424-7890', lat: 37.5133, lng: 127.1001, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-27', name: '홍대온누리약국', address: '서울특별시 마포구 양화로 188', phone: '02-335-2345', lat: 37.5563, lng: 126.9237, holidayOpen: '10:00', holidayClose: '22:00' },
    { id: 'hp-28', name: '신촌휴일약국', address: '서울특별시 서대문구 신촌로 112', phone: '02-324-6789', lat: 37.5596, lng: 126.9426, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-29', name: '왕십리24시약국', address: '서울특별시 성동구 왕십리로 222', phone: '02-2295-1234', lat: 37.5612, lng: 127.0378, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-30', name: '건대입구약국', address: '서울특별시 광진구 아차산로 333', phone: '02-444-5678', lat: 37.5404, lng: 127.0697, holidayOpen: '09:00', holidayClose: '21:00' },
    { id: 'hp-31', name: '신림휴일약국', address: '서울특별시 관악구 신림로 444', phone: '02-871-9012', lat: 37.4848, lng: 126.9296, holidayOpen: '10:00', holidayClose: '18:00' },
    { id: 'hp-32', name: '대림24시약국', address: '서울특별시 영등포구 대림로 555', phone: '02-847-3456', lat: 37.4929, lng: 126.8956, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-33', name: '구의온누리약국', address: '서울특별시 광진구 구의강변로 666', phone: '02-457-7890', lat: 37.5362, lng: 127.0868, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-34', name: '천호휴일약국', address: '서울특별시 강동구 천호대로 777', phone: '02-472-2345', lat: 37.5387, lng: 127.1237, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-35', name: '개봉24시약국', address: '서울특별시 구로구 개봉로 888', phone: '02-867-6789', lat: 37.4935, lng: 126.8553, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-36', name: '역삼온누리약국', address: '서울특별시 강남구 역삼로 999', phone: '02-568-1234', lat: 37.5006, lng: 127.0366, holidayOpen: '09:00', holidayClose: '20:00' },
    { id: 'hp-37', name: '교대휴일약국', address: '서울특별시 서초구 서초대로 111', phone: '02-586-5678', lat: 37.4934, lng: 127.0145, holidayOpen: '10:00', holidayClose: '18:00' },
    { id: 'hp-38', name: '사당24시약국', address: '서울특별시 동작구 사당로 222', phone: '02-593-9012', lat: 37.4767, lng: 126.9817, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-39', name: '수유온누리약국', address: '서울특별시 강북구 수유로 333', phone: '02-998-3456', lat: 37.6383, lng: 127.0255, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-40', name: '상봉휴일약국', address: '서울특별시 중랑구 상봉로 444', phone: '02-436-7890', lat: 37.5965, lng: 127.0930, holidayOpen: '09:00', holidayClose: '18:00' },

    // ===== 경기도 (45개) =====
    { id: 'hp-41', name: '수원역24시약국', address: '경기도 수원시 팔달구 덕영대로 924', phone: '031-246-5678', lat: 37.2664, lng: 127.0016, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-42', name: '분당휴일약국', address: '경기도 성남시 분당구 불정로 6', phone: '031-712-9012', lat: 37.3509, lng: 127.1085, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-43', name: '일산24시약국', address: '경기도 고양시 일산동구 중앙로 1036', phone: '031-901-3456', lat: 37.6512, lng: 126.7739, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-44', name: '용인휴일약국', address: '경기도 용인시 수지구 성복로 64', phone: '031-262-7890', lat: 37.3219, lng: 127.0886, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-45', name: '안양온누리약국', address: '경기도 안양시 동안구 시민대로 235', phone: '031-383-2345', lat: 37.3898, lng: 126.9508, holidayOpen: '10:00', holidayClose: '18:00' },
    { id: 'hp-46', name: '부천24시약국', address: '경기도 부천시 원미구 길주로 210', phone: '032-667-6789', lat: 37.4899, lng: 126.7831, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-47', name: '화성동탄약국', address: '경기도 화성시 동탄대로 446', phone: '031-372-1234', lat: 37.2066, lng: 127.0634, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-48', name: '파주휴일약국', address: '경기도 파주시 금촌로 100', phone: '031-943-5678', lat: 37.7599, lng: 126.7798, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-49', name: '시흥24시약국', address: '경기도 시흥시 시흥대로 200', phone: '031-433-9012', lat: 37.3800, lng: 126.8030, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-50', name: '광명온누리약국', address: '경기도 광명시 광명로 300', phone: '02-898-3456', lat: 37.4786, lng: 126.8644, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-51', name: '의정부휴일약국', address: '경기도 의정부시 시민로 400', phone: '031-845-7890', lat: 37.7381, lng: 127.0337, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-52', name: '남양주24시약국', address: '경기도 남양주시 진접읍 금강로 500', phone: '031-528-2345', lat: 37.6867, lng: 127.1855, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-53', name: '평택온누리약국', address: '경기도 평택시 평택로 600', phone: '031-654-6789', lat: 36.9921, lng: 127.1127, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-54', name: '안산휴일약국', address: '경기도 안산시 단원구 광덕로 700', phone: '031-485-1234', lat: 37.3219, lng: 126.8309, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-55', name: '김포24시약국', address: '경기도 김포시 김포대로 800', phone: '031-988-5678', lat: 37.6153, lng: 126.7156, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-56', name: '광주시온누리약국', address: '경기도 광주시 경충대로 900', phone: '031-762-9012', lat: 37.4095, lng: 127.2550, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-57', name: '오산휴일약국', address: '경기도 오산시 오산로 111', phone: '031-372-3456', lat: 37.1498, lng: 127.0690, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-58', name: '하남24시약국', address: '경기도 하남시 미사대로 222', phone: '031-795-7890', lat: 37.5393, lng: 127.2147, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-59', name: '군포온누리약국', address: '경기도 군포시 산본로 333', phone: '031-392-2345', lat: 37.3616, lng: 126.9352, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-60', name: '이천휴일약국', address: '경기도 이천시 중리천로 444', phone: '031-632-6789', lat: 37.2792, lng: 127.4350, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-61', name: '양주24시약국', address: '경기도 양주시 고읍남로 555', phone: '031-862-1234', lat: 37.7852, lng: 127.0456, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-62', name: '구리온누리약국', address: '경기도 구리시 건원대로 666', phone: '031-555-5678', lat: 37.5943, lng: 127.1295, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-63', name: '포천휴일약국', address: '경기도 포천시 소흘읍 호국로 777', phone: '031-542-9012', lat: 37.8949, lng: 127.2003, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-64', name: '양평24시약국', address: '경기도 양평군 양평읍 중앙로 888', phone: '031-772-3456', lat: 37.4917, lng: 127.4875, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-65', name: '여주온누리약국', address: '경기도 여주시 세종로 999', phone: '031-882-7890', lat: 37.2983, lng: 127.6367, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-66', name: '동두천휴일약국', address: '경기도 동두천시 중앙로 100', phone: '031-862-2345', lat: 37.9035, lng: 127.0606, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-67', name: '안성24시약국', address: '경기도 안성시 중앙로 200', phone: '031-673-6789', lat: 37.0080, lng: 127.2798, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-68', name: '의왕온누리약국', address: '경기도 의왕시 시청로 300', phone: '031-452-1234', lat: 37.3445, lng: 126.9682, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-69', name: '과천휴일약국', address: '경기도 과천시 중앙로 400', phone: '02-503-5678', lat: 37.4292, lng: 126.9875, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-70', name: '가평24시약국', address: '경기도 가평군 가평읍 가평로 500', phone: '031-582-9012', lat: 37.8315, lng: 127.5095, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-71', name: '연천온누리약국', address: '경기도 연천군 연천읍 연천로 600', phone: '031-833-3456', lat: 38.0965, lng: 127.0754, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-72', name: '판교휴일약국', address: '경기도 성남시 분당구 판교역로 700', phone: '031-701-7890', lat: 37.3947, lng: 127.1119, holidayOpen: '10:00', holidayClose: '19:00' },
    { id: 'hp-73', name: '위례24시약국', address: '경기도 성남시 수정구 위례광장로 800', phone: '031-751-2345', lat: 37.4777, lng: 127.1452, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-74', name: '광교온누리약국', address: '경기도 수원시 영통구 광교로 900', phone: '031-211-6789', lat: 37.2844, lng: 127.0473, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-75', name: '동탄휴일약국', address: '경기도 화성시 동탄순환대로 111', phone: '031-378-1234', lat: 37.2002, lng: 127.0982, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-76', name: '죽전24시약국', address: '경기도 용인시 수지구 죽전로 222', phone: '031-896-5678', lat: 37.3244, lng: 127.1072, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-77', name: '기흥온누리약국', address: '경기도 용인시 기흥구 기흥로 333', phone: '031-281-9012', lat: 37.2747, lng: 127.1150, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-78', name: '처인휴일약국', address: '경기도 용인시 처인구 금령로 444', phone: '031-332-3456', lat: 37.2343, lng: 127.2020, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-79', name: '백석24시약국', address: '경기도 고양시 일산동구 백석로 555', phone: '031-912-7890', lat: 37.6407, lng: 126.7811, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-80', name: '주엽온누리약국', address: '경기도 고양시 일산서구 주엽로 666', phone: '031-922-2345', lat: 37.6706, lng: 126.7540, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-81', name: '화정휴일약국', address: '경기도 고양시 덕양구 화정로 777', phone: '031-969-6789', lat: 37.6343, lng: 126.8321, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-82', name: '호평24시약국', address: '경기도 남양주시 호평로 888', phone: '031-558-1234', lat: 37.6633, lng: 127.2173, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-83', name: '별내온누리약국', address: '경기도 남양주시 별내로 999', phone: '031-529-5678', lat: 37.6422, lng: 127.1173, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-84', name: '마석휴일약국', address: '경기도 남양주시 마석로 100', phone: '031-594-9012', lat: 37.6505, lng: 127.3089, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-85', name: '송탄24시약국', address: '경기도 평택시 송탄로 200', phone: '031-662-3456', lat: 37.0822, lng: 127.0598, holidayOpen: '00:00', holidayClose: '24:00' },

    // ===== 인천광역시 (20개) =====
    { id: 'hp-86', name: '인천터미널약국', address: '인천광역시 남동구 예술로 202', phone: '032-431-5678', lat: 37.4487, lng: 126.7020, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-87', name: '부평역24시약국', address: '인천광역시 부평구 부평대로 35', phone: '032-523-9012', lat: 37.4899, lng: 126.7234, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-88', name: '송도휴일약국', address: '인천광역시 연수구 송도과학로 32', phone: '032-851-3456', lat: 37.3845, lng: 126.6557, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-89', name: '계양온누리약국', address: '인천광역시 계양구 계양대로 100', phone: '032-545-7890', lat: 37.5370, lng: 126.7377, holidayOpen: '10:00', holidayClose: '18:00' },
    { id: 'hp-90', name: '서구24시약국', address: '인천광역시 서구 검단로 200', phone: '032-567-2345', lat: 37.5457, lng: 126.6760, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-91', name: '미추홀휴일약국', address: '인천광역시 미추홀구 인하로 300', phone: '032-432-6789', lat: 37.4563, lng: 126.6505, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-92', name: '동구온누리약국', address: '인천광역시 동구 샛골로 400', phone: '032-762-1234', lat: 37.4739, lng: 126.6432, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-93', name: '중구24시약국', address: '인천광역시 중구 제물량로 500', phone: '032-773-5678', lat: 37.4731, lng: 126.6215, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-94', name: '청라휴일약국', address: '인천광역시 서구 청라대로 600', phone: '032-568-9012', lat: 37.5350, lng: 126.6450, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-95', name: '강화온누리약국', address: '인천광역시 강화군 강화읍 강화대로 700', phone: '032-933-3456', lat: 37.7467, lng: 126.4878, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-96', name: '옹진24시약국', address: '인천광역시 옹진군 북도면 시도리 800', phone: '032-899-7890', lat: 37.4427, lng: 126.4338, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-97', name: '주안휴일약국', address: '인천광역시 미추홀구 주안로 900', phone: '032-421-2345', lat: 37.4637, lng: 126.6795, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-98', name: '간석온누리약국', address: '인천광역시 남동구 간석로 111', phone: '032-428-6789', lat: 37.4644, lng: 126.7174, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-99', name: '구월24시약국', address: '인천광역시 남동구 구월로 222', phone: '032-466-1234', lat: 37.4500, lng: 126.7212, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-100', name: '논현휴일약국', address: '인천광역시 남동구 논현로 333', phone: '032-453-5678', lat: 37.4078, lng: 126.7378, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-101', name: '십정온누리약국', address: '인천광역시 부평구 십정로 444', phone: '032-521-9012', lat: 37.4957, lng: 126.7103, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-102', name: '삼산24시약국', address: '인천광역시 부평구 삼산로 555', phone: '032-507-3456', lat: 37.5126, lng: 126.7396, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-103', name: '작전휴일약국', address: '인천광역시 계양구 작전로 666', phone: '032-551-7890', lat: 37.5319, lng: 126.7216, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-104', name: '효성온누리약국', address: '인천광역시 계양구 효성로 777', phone: '032-553-2345', lat: 37.5413, lng: 126.7159, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-105', name: '용현24시약국', address: '인천광역시 미추홀구 용현로 888', phone: '032-876-6789', lat: 37.4487, lng: 126.6447, holidayOpen: '00:00', holidayClose: '24:00' },

    // ===== 부산광역시 (20개) =====
    { id: 'hp-106', name: '서면24시약국', address: '부산광역시 부산진구 서면문화로 27', phone: '051-803-7890', lat: 35.1579, lng: 129.0588, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-107', name: '해운대휴일약국', address: '부산광역시 해운대구 해운대로 587', phone: '051-746-2345', lat: 35.1631, lng: 129.1638, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-108', name: '동래온누리약국', address: '부산광역시 동래구 명륜로 183', phone: '051-556-6789', lat: 35.2047, lng: 129.0786, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-109', name: '남포동24시약국', address: '부산광역시 중구 광복로 62', phone: '051-245-1234', lat: 35.0987, lng: 129.0324, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-110', name: '사상휴일약국', address: '부산광역시 사상구 사상로 100', phone: '051-325-5678', lat: 35.1525, lng: 128.9829, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-111', name: '남구온누리약국', address: '부산광역시 남구 수영로 200', phone: '051-622-9012', lat: 35.1366, lng: 129.0845, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-112', name: '북구24시약국', address: '부산광역시 북구 만덕대로 300', phone: '051-331-3456', lat: 35.1972, lng: 129.0313, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-113', name: '사하휴일약국', address: '부산광역시 사하구 다대로 400', phone: '051-207-7890', lat: 35.1046, lng: 128.9750, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-114', name: '강서온누리약국', address: '부산광역시 강서구 명지오션시티로 500', phone: '051-971-2345', lat: 35.1047, lng: 128.9324, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-115', name: '연제24시약국', address: '부산광역시 연제구 연산로 600', phone: '051-853-6789', lat: 35.1760, lng: 129.0798, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-116', name: '금정휴일약국', address: '부산광역시 금정구 금정로 700', phone: '051-518-1234', lat: 35.2428, lng: 129.0922, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-117', name: '기장온누리약국', address: '부산광역시 기장군 기장읍 기장대로 800', phone: '051-721-5678', lat: 35.2445, lng: 129.2222, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-118', name: '수영24시약국', address: '부산광역시 수영구 수영로 900', phone: '051-751-9012', lat: 35.1457, lng: 129.1133, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-119', name: '영도휴일약국', address: '부산광역시 영도구 태종로 111', phone: '051-416-3456', lat: 35.0885, lng: 129.0666, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-120', name: '동구온누리약국', address: '부산광역시 동구 중앙대로 222', phone: '051-467-7890', lat: 35.1291, lng: 129.0450, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-121', name: '서구24시약국', address: '부산광역시 서구 보수대로 333', phone: '051-254-2345', lat: 35.0977, lng: 129.0241, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-122', name: '광안리휴일약국', address: '부산광역시 수영구 광안해변로 444', phone: '051-753-6789', lat: 35.1531, lng: 129.1186, holidayOpen: '09:00', holidayClose: '20:00' },
    { id: 'hp-123', name: '센텀온누리약국', address: '부산광역시 해운대구 센텀동로 555', phone: '051-742-1234', lat: 35.1696, lng: 129.1320, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-124', name: '덕천24시약국', address: '부산광역시 북구 덕천로 666', phone: '051-334-5678', lat: 35.2067, lng: 129.0150, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-125', name: '장산휴일약국', address: '부산광역시 해운대구 좌동로 777', phone: '051-784-9012', lat: 35.1842, lng: 129.1733, holidayOpen: '09:00', holidayClose: '17:00' },

    // ===== 대구광역시 (15개) =====
    { id: 'hp-126', name: '동성로24시약국', address: '대구광역시 중구 동성로2길 81', phone: '053-252-5678', lat: 35.8681, lng: 128.5961, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-127', name: '수성휴일약국', address: '대구광역시 수성구 동대구로 364', phone: '053-762-9012', lat: 35.8563, lng: 128.6294, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-128', name: '달서온누리약국', address: '대구광역시 달서구 월성로 233', phone: '053-631-3456', lat: 35.8282, lng: 128.5330, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-129', name: '북구24시약국', address: '대구광역시 북구 옥산로 100', phone: '053-321-7890', lat: 35.8858, lng: 128.5828, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-130', name: '동구휴일약국', address: '대구광역시 동구 아양로 200', phone: '053-954-2345', lat: 35.8700, lng: 128.6350, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-131', name: '서구온누리약국', address: '대구광역시 서구 국채보상로 300', phone: '053-565-6789', lat: 35.8714, lng: 128.5592, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-132', name: '남구24시약국', address: '대구광역시 남구 봉덕로 400', phone: '053-475-1234', lat: 35.8460, lng: 128.5970, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-133', name: '달성휴일약국', address: '대구광역시 달성군 다사읍 달구벌대로 500', phone: '053-584-5678', lat: 35.8526, lng: 128.4667, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-134', name: '중구온누리약국', address: '대구광역시 중구 달구벌대로 600', phone: '053-255-9012', lat: 35.8668, lng: 128.5938, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-135', name: '범어24시약국', address: '대구광역시 수성구 범어로 700', phone: '053-751-3456', lat: 35.8580, lng: 128.6180, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-136', name: '칠곡휴일약국', address: '대구광역시 북구 칠곡중앙로 800', phone: '053-325-7890', lat: 35.8974, lng: 128.5503, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-137', name: '상인온누리약국', address: '대구광역시 달서구 상인로 900', phone: '053-632-2345', lat: 35.8180, lng: 128.5419, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-138', name: '성서24시약국', address: '대구광역시 달서구 성서로 111', phone: '053-584-6789', lat: 35.8519, lng: 128.5061, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-139', name: '신천휴일약국', address: '대구광역시 동구 신천로 222', phone: '053-745-1234', lat: 35.8602, lng: 128.6124, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-140', name: '안심온누리약국', address: '대구광역시 동구 안심로 333', phone: '053-961-5678', lat: 35.8689, lng: 128.6787, holidayOpen: '10:00', holidayClose: '17:00' },

    // ===== 대전광역시 (12개) =====
    { id: 'hp-141', name: '둔산24시약국', address: '대전광역시 서구 둔산로 117', phone: '042-472-7890', lat: 36.3512, lng: 127.3785, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-142', name: '유성휴일약국', address: '대전광역시 유성구 대학로 76', phone: '042-823-2345', lat: 36.3623, lng: 127.3562, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-143', name: '대전역온누리약국', address: '대전광역시 동구 동서대로 1689', phone: '042-253-6789', lat: 36.3324, lng: 127.4346, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-144', name: '동구24시약국', address: '대전광역시 동구 동서대로 100', phone: '042-284-1234', lat: 36.3119, lng: 127.4548, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-145', name: '중구휴일약국', address: '대전광역시 중구 대종로 200', phone: '042-222-5678', lat: 36.3253, lng: 127.4216, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-146', name: '대덕온누리약국', address: '대전광역시 대덕구 한밭대로 300', phone: '042-622-9012', lat: 36.3467, lng: 127.4156, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-147', name: '서구24시약국', address: '대전광역시 서구 계룡로 400', phone: '042-524-3456', lat: 36.3541, lng: 127.3687, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-148', name: '노은휴일약국', address: '대전광역시 유성구 노은로 500', phone: '042-864-7890', lat: 36.3680, lng: 127.3180, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-149', name: '관저온누리약국', address: '대전광역시 서구 관저로 600', phone: '042-541-2345', lat: 36.3108, lng: 127.3355, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-150', name: '탄방24시약국', address: '대전광역시 서구 탄방로 700', phone: '042-488-6789', lat: 36.3556, lng: 127.3791, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-151', name: '월평휴일약국', address: '대전광역시 서구 월평로 800', phone: '042-474-1234', lat: 36.3630, lng: 127.3635, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-152', name: '봉명온누리약국', address: '대전광역시 유성구 봉명로 900', phone: '042-828-5678', lat: 36.3561, lng: 127.3470, holidayOpen: '09:00', holidayClose: '17:00' },

    // ===== 광주광역시 (12개) =====
    { id: 'hp-153', name: '상무24시약국', address: '광주광역시 서구 상무중앙로 76', phone: '062-375-1234', lat: 35.1469, lng: 126.8512, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-154', name: '충장로휴일약국', address: '광주광역시 동구 충장로 64', phone: '062-223-5678', lat: 35.1486, lng: 126.9187, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-155', name: '광주역온누리약국', address: '광주광역시 북구 무등로 235', phone: '062-513-9012', lat: 35.1595, lng: 126.9141, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-156', name: '남구24시약국', address: '광주광역시 남구 봉선로 100', phone: '062-673-3456', lat: 35.1334, lng: 126.9023, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-157', name: '동구휴일약국', address: '광주광역시 동구 금남로 200', phone: '062-225-7890', lat: 35.1459, lng: 126.9234, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-158', name: '광산온누리약국', address: '광주광역시 광산구 광산로 300', phone: '062-952-2345', lat: 35.1395, lng: 126.7936, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-159', name: '첨단24시약국', address: '광주광역시 광산구 첨단로 400', phone: '062-972-6789', lat: 35.2186, lng: 126.8469, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-160', name: '수완휴일약국', address: '광주광역시 광산구 수완로 500', phone: '062-943-1234', lat: 35.1898, lng: 126.8245, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-161', name: '운남온누리약국', address: '광주광역시 광산구 운남로 600', phone: '062-955-5678', lat: 35.1756, lng: 126.7812, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-162', name: '송정24시약국', address: '광주광역시 광산구 송정로 700', phone: '062-941-9012', lat: 35.1391, lng: 126.7928, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-163', name: '용봉휴일약국', address: '광주광역시 북구 용봉로 800', phone: '062-528-3456', lat: 35.1733, lng: 126.9127, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-164', name: '양산온누리약국', address: '광주광역시 북구 양산로 900', phone: '062-522-7890', lat: 35.1821, lng: 126.8962, holidayOpen: '09:00', holidayClose: '17:00' },

    // ===== 울산광역시 (8개) =====
    { id: 'hp-165', name: '울산24시약국', address: '울산광역시 남구 삼산로 258', phone: '052-267-3456', lat: 35.5384, lng: 129.3114, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-166', name: '신복휴일약국', address: '울산광역시 울주군 범서읍 점촌3길 26', phone: '052-229-7890', lat: 35.5621, lng: 129.2654, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-167', name: '중구온누리약국', address: '울산광역시 중구 번영로 100', phone: '052-246-2345', lat: 35.5684, lng: 129.3328, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-168', name: '동구24시약국', address: '울산광역시 동구 방어로 200', phone: '052-232-6789', lat: 35.5049, lng: 129.4168, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-169', name: '북구휴일약국', address: '울산광역시 북구 진장유통로 300', phone: '052-285-1234', lat: 35.5821, lng: 129.3612, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-170', name: '울주온누리약국', address: '울산광역시 울주군 언양읍 언양로 400', phone: '052-262-5678', lat: 35.5621, lng: 129.1195, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-171', name: '태화강24시약국', address: '울산광역시 중구 태화로 500', phone: '052-248-9012', lat: 35.5556, lng: 129.3167, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-172', name: '신정휴일약국', address: '울산광역시 남구 신정로 600', phone: '052-272-3456', lat: 35.5333, lng: 129.3077, holidayOpen: '09:00', holidayClose: '18:00' },

    // ===== 세종특별자치시 (5개) =====
    { id: 'hp-173', name: '세종24시약국', address: '세종특별자치시 한누리대로 2180', phone: '044-862-2345', lat: 36.4800, lng: 127.2890, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-174', name: '조치원휴일약국', address: '세종특별자치시 조치원읍 죽림로 100', phone: '044-862-6789', lat: 36.6039, lng: 127.2986, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-175', name: '도담온누리약국', address: '세종특별자치시 도담동 도담로 200', phone: '044-864-1234', lat: 36.5100, lng: 127.2600, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-176', name: '아름24시약국', address: '세종특별자치시 아름동 아름로 300', phone: '044-866-5678', lat: 36.4950, lng: 127.2450, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-177', name: '보람휴일약국', address: '세종특별자치시 보람동 보람로 400', phone: '044-868-9012', lat: 36.4750, lng: 127.2700, holidayOpen: '09:00', holidayClose: '18:00' },

    // ===== 강원도 (12개) =====
    { id: 'hp-178', name: '춘천역24시약국', address: '강원도 춘천시 중앙로 2', phone: '033-253-6789', lat: 37.8813, lng: 127.7298, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-179', name: '원주휴일약국', address: '강원도 원주시 중앙로 85', phone: '033-748-1234', lat: 37.3422, lng: 127.9202, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-180', name: '강릉온누리약국', address: '강원도 강릉시 경강로 2046', phone: '033-644-5678', lat: 37.7519, lng: 128.8760, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-181', name: '속초24시약국', address: '강원도 속초시 중앙로 100', phone: '033-632-9012', lat: 38.2070, lng: 128.5918, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-182', name: '동해휴일약국', address: '강원도 동해시 천곡로 200', phone: '033-533-3456', lat: 37.5246, lng: 129.1143, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-183', name: '삼척온누리약국', address: '강원도 삼척시 중앙로 300', phone: '033-572-7890', lat: 37.4499, lng: 129.1652, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-184', name: '태백24시약국', address: '강원도 태백시 황지로 400', phone: '033-552-2345', lat: 37.1640, lng: 128.9856, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-185', name: '홍천휴일약국', address: '강원도 홍천군 홍천읍 홍천로 500', phone: '033-433-6789', lat: 37.6966, lng: 127.8889, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-186', name: '횡성온누리약국', address: '강원도 횡성군 횡성읍 문화체육로 600', phone: '033-343-1234', lat: 37.4917, lng: 127.9850, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-187', name: '정선24시약국', address: '강원도 정선군 정선읍 봉양로 700', phone: '033-563-5678', lat: 37.3805, lng: 128.6608, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-188', name: '평창휴일약국', address: '강원도 평창군 평창읍 평창로 800', phone: '033-332-9012', lat: 37.3707, lng: 128.3900, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-189', name: '영월온누리약국', address: '강원도 영월군 영월읍 중앙로 900', phone: '033-373-3456', lat: 37.1837, lng: 128.4617, holidayOpen: '09:00', holidayClose: '17:00' },

    // ===== 충청북도 (10개) =====
    { id: 'hp-190', name: '청주24시약국', address: '충청북도 청주시 상당구 상당로 314', phone: '043-254-9012', lat: 36.6424, lng: 127.4890, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-191', name: '충주휴일약국', address: '충청북도 충주시 성서동 1411', phone: '043-845-3456', lat: 36.9910, lng: 127.9259, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-192', name: '제천온누리약국', address: '충청북도 제천시 의림대로 100', phone: '043-647-7890', lat: 37.1326, lng: 128.1910, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-193', name: '음성24시약국', address: '충청북도 음성군 음성읍 중앙로 200', phone: '043-877-2345', lat: 36.9399, lng: 127.6908, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-194', name: '진천휴일약국', address: '충청북도 진천군 진천읍 중앙북로 300', phone: '043-532-6789', lat: 36.8554, lng: 127.4363, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-195', name: '옥천온누리약국', address: '충청북도 옥천군 옥천읍 금장로 400', phone: '043-732-1234', lat: 36.3062, lng: 127.5714, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-196', name: '영동24시약국', address: '충청북도 영동군 영동읍 중앙로 500', phone: '043-742-5678', lat: 36.1749, lng: 127.7835, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-197', name: '증평휴일약국', address: '충청북도 증평군 증평읍 증평로 600', phone: '043-835-9012', lat: 36.7855, lng: 127.5816, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-198', name: '괴산온누리약국', address: '충청북도 괴산군 괴산읍 괴산로 700', phone: '043-832-3456', lat: 36.8154, lng: 127.7867, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-199', name: '보은24시약국', address: '충청북도 보은군 보은읍 삼산로 800', phone: '043-542-7890', lat: 36.4893, lng: 127.7294, holidayOpen: '00:00', holidayClose: '24:00' },

    // ===== 충청남도 (12개) =====
    { id: 'hp-200', name: '천안역24시약국', address: '충청남도 천안시 동남구 대흥로 201', phone: '041-563-7890', lat: 36.8151, lng: 127.1139, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-201', name: '아산휴일약국', address: '충청남도 아산시 배방읍 희망로 100', phone: '041-532-2345', lat: 36.7898, lng: 127.0047, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-202', name: '서산온누리약국', address: '충청남도 서산시 중앙로 200', phone: '041-664-6789', lat: 36.7845, lng: 126.4503, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-203', name: '논산24시약국', address: '충청남도 논산시 시민로 300', phone: '041-733-1234', lat: 36.1872, lng: 127.0987, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-204', name: '공주휴일약국', address: '충청남도 공주시 웅진로 400', phone: '041-852-5678', lat: 36.4465, lng: 127.1190, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-205', name: '보령온누리약국', address: '충청남도 보령시 대천로 500', phone: '041-932-9012', lat: 36.3334, lng: 126.6128, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-206', name: '당진24시약국', address: '충청남도 당진시 당진중앙로 600', phone: '041-352-3456', lat: 36.8898, lng: 126.6295, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-207', name: '홍성휴일약국', address: '충청남도 홍성군 홍성읍 중앙로 700', phone: '041-632-7890', lat: 36.6012, lng: 126.6604, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-208', name: '예산온누리약국', address: '충청남도 예산군 예산읍 천변로 800', phone: '041-332-2345', lat: 36.6826, lng: 126.8487, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-209', name: '계룡24시약국', address: '충청남도 계룡시 계룡대로 900', phone: '042-841-6789', lat: 36.2746, lng: 127.2487, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-210', name: '태안휴일약국', address: '충청남도 태안군 태안읍 서해로 111', phone: '041-672-1234', lat: 36.7455, lng: 126.2979, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-211', name: '청양온누리약국', address: '충청남도 청양군 청양읍 칠갑로 222', phone: '041-942-5678', lat: 36.4591, lng: 126.8022, holidayOpen: '09:00', holidayClose: '17:00' },

    // ===== 전라북도 (10개) =====
    { id: 'hp-212', name: '전주24시약국', address: '전라북도 전주시 완산구 전주객사3길 22', phone: '063-284-6789', lat: 35.8242, lng: 127.1480, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-213', name: '익산휴일약국', address: '전라북도 익산시 익산대로 252', phone: '063-835-1234', lat: 35.9483, lng: 126.9576, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-214', name: '군산온누리약국', address: '전라북도 군산시 수송로 100', phone: '063-453-5678', lat: 35.9676, lng: 126.7369, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-215', name: '정읍24시약국', address: '전라북도 정읍시 충정로 200', phone: '063-532-9012', lat: 35.5699, lng: 126.8560, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-216', name: '남원휴일약국', address: '전라북도 남원시 용성로 300', phone: '063-632-3456', lat: 35.4163, lng: 127.3903, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-217', name: '김제온누리약국', address: '전라북도 김제시 요촌로 400', phone: '063-542-7890', lat: 35.8038, lng: 126.8809, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-218', name: '완주24시약국', address: '전라북도 완주군 봉동읍 완주로 500', phone: '063-262-2345', lat: 35.8446, lng: 127.1428, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-219', name: '고창휴일약국', address: '전라북도 고창군 고창읍 읍내로 600', phone: '063-562-6789', lat: 35.4358, lng: 126.7019, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-220', name: '부안온누리약국', address: '전라북도 부안군 부안읍 매창로 700', phone: '063-582-1234', lat: 35.7316, lng: 126.7335, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-221', name: '순창24시약국', address: '전라북도 순창군 순창읍 순화로 800', phone: '063-652-5678', lat: 35.3744, lng: 127.1376, holidayOpen: '00:00', holidayClose: '24:00' },

    // ===== 전라남도 (12개) =====
    { id: 'hp-222', name: '목포24시약국', address: '전라남도 목포시 하당로 123', phone: '061-285-5678', lat: 34.8118, lng: 126.3922, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-223', name: '순천휴일약국', address: '전라남도 순천시 장천로 96', phone: '061-752-9012', lat: 34.9506, lng: 127.4872, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-224', name: '여수온누리약국', address: '전라남도 여수시 시청로 1', phone: '061-653-3456', lat: 34.7604, lng: 127.6622, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-225', name: '광양24시약국', address: '전라남도 광양시 광양읍 칠성로 100', phone: '061-762-7890', lat: 34.9407, lng: 127.5857, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-226', name: '나주휴일약국', address: '전라남도 나주시 죽림길 200', phone: '061-332-2345', lat: 35.0159, lng: 126.7110, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-227', name: '무안온누리약국', address: '전라남도 무안군 무안읍 무안로 300', phone: '061-452-6789', lat: 34.9905, lng: 126.4815, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-228', name: '해남24시약국', address: '전라남도 해남군 해남읍 중앙로 400', phone: '061-532-1234', lat: 34.5736, lng: 126.5990, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-229', name: '영암휴일약국', address: '전라남도 영암군 영암읍 동무로 500', phone: '061-472-5678', lat: 34.8002, lng: 126.6981, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-230', name: '담양온누리약국', address: '전라남도 담양군 담양읍 추월로 600', phone: '061-382-9012', lat: 35.3214, lng: 126.9884, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-231', name: '장성24시약국', address: '전라남도 장성군 장성읍 중앙로 700', phone: '061-392-3456', lat: 35.3020, lng: 126.7849, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-232', name: '완도휴일약국', address: '전라남도 완도군 완도읍 장보고대로 800', phone: '061-552-7890', lat: 34.3110, lng: 126.7554, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-233', name: '진도온누리약국', address: '전라남도 진도군 진도읍 동외리 900', phone: '061-542-2345', lat: 34.4869, lng: 126.2634, holidayOpen: '09:00', holidayClose: '17:00' },

    // ===== 경상북도 (12개) =====
    { id: 'hp-234', name: '포항24시약국', address: '경상북도 포항시 남구 대이로 45', phone: '054-275-7890', lat: 36.0190, lng: 129.3435, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-235', name: '경주휴일약국', address: '경상북도 경주시 원화로 285', phone: '054-773-2345', lat: 35.8562, lng: 129.2247, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-236', name: '구미온누리약국', address: '경상북도 구미시 송정대로 120', phone: '054-452-6789', lat: 36.1195, lng: 128.3446, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-237', name: '안동24시약국', address: '경상북도 안동시 경동로 100', phone: '054-853-1234', lat: 36.5684, lng: 128.7294, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-238', name: '김천휴일약국', address: '경상북도 김천시 평화로 200', phone: '054-433-5678', lat: 36.1398, lng: 128.1136, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-239', name: '영주온누리약국', address: '경상북도 영주시 광복로 300', phone: '054-632-9012', lat: 36.8057, lng: 128.6240, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-240', name: '상주24시약국', address: '경상북도 상주시 상주로 400', phone: '054-532-3456', lat: 36.4110, lng: 128.1590, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-241', name: '문경휴일약국', address: '경상북도 문경시 문경대로 500', phone: '054-552-7890', lat: 36.5867, lng: 128.1867, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-242', name: '경산온누리약국', address: '경상북도 경산시 중앙로 600', phone: '053-812-2345', lat: 35.8251, lng: 128.7414, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-243', name: '칠곡24시약국', address: '경상북도 칠곡군 왜관읍 왜관로 700', phone: '054-972-6789', lat: 35.9734, lng: 128.4013, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-244', name: '영천휴일약국', address: '경상북도 영천시 완산로 800', phone: '054-332-1234', lat: 35.9733, lng: 128.9387, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-245', name: '영덕온누리약국', address: '경상북도 영덕군 영덕읍 영덕로 900', phone: '054-732-5678', lat: 36.4151, lng: 129.3656, holidayOpen: '09:00', holidayClose: '17:00' },

    // ===== 경상남도 (12개) =====
    { id: 'hp-246', name: '창원24시약국', address: '경상남도 창원시 성산구 상남로 55', phone: '055-285-1234', lat: 35.2275, lng: 128.6819, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-247', name: '김해휴일약국', address: '경상남도 김해시 호계로 395', phone: '055-322-5678', lat: 35.2341, lng: 128.8890, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-248', name: '진주온누리약국', address: '경상남도 진주시 진주대로 887', phone: '055-753-9012', lat: 35.1801, lng: 128.1076, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-249', name: '양산24시약국', address: '경상남도 양산시 중앙로 100', phone: '055-382-3456', lat: 35.3350, lng: 129.0372, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-250', name: '거제휴일약국', address: '경상남도 거제시 중앙로 200', phone: '055-632-7890', lat: 34.8808, lng: 128.6211, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-251', name: '통영온누리약국', address: '경상남도 통영시 광도면 죽림로 300', phone: '055-646-2345', lat: 34.8545, lng: 128.4330, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-252', name: '사천24시약국', address: '경상남도 사천시 용현면 사천대로 400', phone: '055-852-6789', lat: 35.0037, lng: 128.0647, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-253', name: '밀양휴일약국', address: '경상남도 밀양시 중앙로 500', phone: '055-352-1234', lat: 35.5037, lng: 128.7464, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-254', name: '함안온누리약국', address: '경상남도 함안군 가야읍 함안대로 600', phone: '055-582-5678', lat: 35.2726, lng: 128.4066, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-255', name: '창녕24시약국', address: '경상남도 창녕군 창녕읍 창녕대로 700', phone: '055-532-9012', lat: 35.5427, lng: 128.4922, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-256', name: '거창휴일약국', address: '경상남도 거창군 거창읍 거창대로 800', phone: '055-943-3456', lat: 35.6867, lng: 127.9093, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-257', name: '합천온누리약국', address: '경상남도 합천군 합천읍 동서로 900', phone: '055-932-7890', lat: 35.5667, lng: 128.1657, holidayOpen: '09:00', holidayClose: '17:00' },

    // ===== 제주특별자치도 (10개) =====
    { id: 'hp-258', name: '제주시24시약국', address: '제주특별자치도 제주시 중앙로 217', phone: '064-752-3456', lat: 33.4996, lng: 126.5312, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-259', name: '서귀포휴일약국', address: '제주특별자치도 서귀포시 중앙로 67', phone: '064-732-7890', lat: 33.2541, lng: 126.5603, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-260', name: '공항로온누리약국', address: '제주특별자치도 제주시 공항로 2', phone: '064-742-2345', lat: 33.5067, lng: 126.4928, holidayOpen: '08:00', holidayClose: '22:00' },
    { id: 'hp-261', name: '연동24시약국', address: '제주특별자치도 제주시 연동 100', phone: '064-712-6789', lat: 33.4890, lng: 126.4982, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-262', name: '노형휴일약국', address: '제주특별자치도 제주시 노형로 200', phone: '064-722-1234', lat: 33.4856, lng: 126.4747, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-263', name: '아라온누리약국', address: '제주특별자치도 제주시 아라로 300', phone: '064-762-5678', lat: 33.4688, lng: 126.5254, holidayOpen: '10:00', holidayClose: '17:00' },
    { id: 'hp-264', name: '중문24시약국', address: '제주특별자치도 서귀포시 중문관광로 400', phone: '064-738-9012', lat: 33.2542, lng: 126.4107, holidayOpen: '00:00', holidayClose: '24:00' },
    { id: 'hp-265', name: '성산휴일약국', address: '제주특별자치도 서귀포시 성산읍 성산로 500', phone: '064-782-3456', lat: 33.4362, lng: 126.9145, holidayOpen: '09:00', holidayClose: '18:00' },
    { id: 'hp-266', name: '애월온누리약국', address: '제주특별자치도 제주시 애월읍 애월로 600', phone: '064-799-7890', lat: 33.4628, lng: 126.3271, holidayOpen: '09:00', holidayClose: '17:00' },
    { id: 'hp-267', name: '한림24시약국', address: '제주특별자치도 제주시 한림읍 한림로 700', phone: '064-796-2345', lat: 33.4136, lng: 126.2653, holidayOpen: '00:00', holidayClose: '24:00' },
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
    const Q0 = url.searchParams.get('Q0') || ''; // 시도
    const Q1 = url.searchParams.get('Q1') || ''; // 시군구
    const pageNo = url.searchParams.get('pageNo') || '1';
    const numOfRows = url.searchParams.get('numOfRows') || '100';
    const useMock = url.searchParams.get('useMock') === 'true';

    console.log(`Fetching holiday pharmacies: Q0=${Q0}, Q1=${Q1}, pageNo=${pageNo}, numOfRows=${numOfRows}`);

    // If no API key or useMock is true, return mock data
    if (!serviceKey || useMock) {
      console.log('Using mock holiday pharmacy data');
      const mockData = getMockHolidayPharmacies();
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

    // Try to fetch from API - QT=8 is for 공휴일 (holidays)
    const isAlreadyEncoded = serviceKey.includes('%');
    const encodedKey = isAlreadyEncoded ? serviceKey : encodeURIComponent(serviceKey);

    let apiUrl = `${API_URL}?serviceKey=${encodedKey}&QT=8&pageNo=${pageNo}&numOfRows=${numOfRows}`;
    
    if (Q0) {
      apiUrl += `&Q0=${encodeURIComponent(Q0)}`;
    }
    if (Q1) {
      apiUrl += `&Q1=${encodeURIComponent(Q1)}`;
    }

    console.log('API URL:', apiUrl.replace(encodedKey, 'HIDDEN'));

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/xml',
      },
    });

    if (!response.ok) {
      console.error('API request failed:', response.status);
      const mockData = getMockHolidayPharmacies();
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
      const mockData = getMockHolidayPharmacies();
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

    // Parse pharmacy items
    const pharmacies: HolidayPharmacy[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const item = match[1];
      
      // Parse coordinates
      const lat = getFloatValue(item, 'wgs84Lat');
      const lng = getFloatValue(item, 'wgs84Lon');
      
      // Skip if no valid coordinates
      if (!lat || !lng || lat < 33 || lat > 39 || lng < 124 || lng > 132) {
        continue;
      }

      const pharmacy: HolidayPharmacy = {
        id: getValue(item, 'hpid') || `hp-api-${pharmacies.length}`,
        name: getValue(item, 'dutyName') || '알 수 없음',
        address: getValue(item, 'dutyAddr') || '',
        phone: getValue(item, 'dutyTel1') || '',
        lat,
        lng,
        mondayOpen: getValue(item, 'dutyTime1s'),
        mondayClose: getValue(item, 'dutyTime1c'),
        holidayOpen: getValue(item, 'dutyTime8s'),
        holidayClose: getValue(item, 'dutyTime8c'),
      };

      pharmacies.push(pharmacy);
    }

    console.log(`Parsed ${pharmacies.length} holiday pharmacies from API`);

    // If no pharmacies found from API, use mock data
    if (pharmacies.length === 0) {
      console.log('No pharmacies from API, using mock data');
      const mockData = getMockHolidayPharmacies();
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
    const totalCount = parseInt(getValue(xmlText, 'totalCount')) || pharmacies.length;

    return new Response(
      JSON.stringify({
        success: true,
        data: pharmacies,
        totalCount,
        pageNo: parseInt(pageNo),
        numOfRows: parseInt(numOfRows),
        source: 'api',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error fetching holiday pharmacies:', error);
    const mockData = getMockHolidayPharmacies();
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
