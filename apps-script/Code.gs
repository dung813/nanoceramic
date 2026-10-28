const SPREADSHEET_ID = '1n7VjHfiLMSj039oQ67FSjBwerqj5O6KiP1S4vrdhj-c';
const SHEET_NAME = 'Lịch đặt hẹn';
const HEADERS = [
  'Thời gian nhận',
  'Mã yêu cầu',
  'Họ và tên',
  'Số điện thoại',
  'Dịch vụ',
  'Gói dịch vụ',
  'Dòng xe / mẫu xe',
  'Loại xe',
  'Địa điểm thi công',
  'Ngày mong muốn',
  'Khung giờ mong muốn',
  'Ghi chú',
  'Trạng thái'
];

function setupBookingSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
  if (currentHeaders.some((value, index) => value && value !== HEADERS[index])) {
    throw new Error('Hàng đầu tiên của sheet đã có tiêu đề khác. Hãy dùng một sheet trống.');
  }

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sheet.getRange('B:B').setNumberFormat('@');
  sheet.getRange('D:D').setNumberFormat('@');
  sheet.autoResizeColumns(1, HEADERS.length);
  return 'Đã chuẩn bị sheet "' + SHEET_NAME + '".';
}

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents);
    const booking = validateBooking(payload);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      const sheet = getBookingSheet();
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const existing = sheet.getRange(2, 2, lastRow - 1, 1)
          .createTextFinder(booking.requestId)
          .matchEntireCell(true)
          .findNext();
        if (existing) {
          return jsonResponse({ ok: true, duplicate: true, requestId: booking.requestId });
        }
      }

      sheet.appendRow([
        new Date(),
        booking.requestId,
        safeCell(booking.name),
        safeCell(booking.phone),
        safeCell(booking.service),
        safeCell(booking.package),
        safeCell(booking.vehicle),
        safeCell(booking.vehicleType),
        safeCell(booking.branch),
        booking.date,
        safeCell(booking.time),
        safeCell(booking.note),
        'Mới'
      ]);
    } finally {
      lock.releaseLock();
    }

    return jsonResponse({ ok: true, duplicate: false, requestId: booking.requestId });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error && error.message ? error.message : 'Không thể lưu yêu cầu đặt lịch.'
    });
  }
}

function getBookingSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0].join('\t') !== HEADERS.join('\t')) {
    throw new Error('Sheet chưa được khởi tạo. Hãy chạy setupBookingSheet trước.');
  }
  return sheet;
}

function validateBooking(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Dữ liệu gửi lên không hợp lệ.');
  }
  if (String(payload.website || '').trim()) {
    throw new Error('Yêu cầu không hợp lệ.');
  }

  const booking = {
    requestId: requiredText(payload.requestId, 'Mã yêu cầu', 64),
    name: requiredText(payload.name, 'Họ và tên', 120),
    phone: requiredText(payload.phone, 'Số điện thoại', 40),
    service: requiredText(payload.service, 'Dịch vụ', 120),
    package: optionalText(payload.package, 120),
    vehicle: requiredText(payload.vehicle, 'Dòng xe / mẫu xe', 120),
    vehicleType: optionalText(payload.vehicleType, 80),
    branch: requiredText(payload.branch, 'Địa điểm thi công', 120),
    date: requiredText(payload.date, 'Ngày mong muốn', 10),
    time: optionalText(payload.time, 80),
    note: optionalText(payload.note, 1000)
  };
  const digits = booking.phone.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    throw new Error('Số điện thoại không hợp lệ.');
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(booking.requestId)) {
    throw new Error('Mã yêu cầu không hợp lệ.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(booking.date)) {
    throw new Error('Ngày mong muốn không hợp lệ.');
  }
  const parsedDate = new Date(booking.date + 'T00:00:00Z');
  if (isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== booking.date) {
    throw new Error('Ngày mong muốn không hợp lệ.');
  }
  const today = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
  if (booking.date < today) throw new Error('Ngày mong muốn không thể ở quá khứ.');
  if (booking.service !== 'Phim cách nhiệt ô tô' && booking.service !== 'PPF') {
    throw new Error('Dịch vụ đã chọn không hợp lệ.');
  }
  return booking;
}

function requiredText(value, label, maxLength) {
  const text = optionalText(value, maxLength);
  if (!text) throw new Error('Vui lòng nhập ' + label.toLowerCase() + '.');
  return text;
}

function optionalText(value, maxLength) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new Error('Dữ liệu gửi lên không hợp lệ.');
  const text = value.trim();
  if (text.length > maxLength) throw new Error('Một trường thông tin vượt quá độ dài cho phép.');
  return text;
}

function safeCell(value) {
  return /^[\s]*[=+\-@]/.test(value) ? "'" + value : value;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
