/* Appointment request form shared across booking links. */
(function () {
  'use strict';

  var dialog = document.getElementById('booking-dialog');
  var form = document.getElementById('booking-form');
  if (!dialog || !form) return;

  var service = document.getElementById('booking-service');
  var phoneInput = document.getElementById('booking-phone');
  var packageInput = document.getElementById('booking-package');
  var vehicleInput = document.getElementById('booking-vehicle');
  var status = form.querySelector('.booking-status');
  var dateInput = form.elements.date;
  var now = new Date();
  var today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dateInput.min = today;

  function validatePhone() {
    var value = phoneInput.value.trim();
    var digits = value.replace(/\D/g, '');
    var valid = /^[0-9+().\s-]+$/.test(value) && digits.length >= 8 && digits.length <= 15;
    phoneInput.setCustomValidity(valid || !value ? '' : 'Nhập số điện thoại hợp lệ (8–15 chữ số).');
  }

  function showStatus(message, state) {
    status.textContent = message;
    status.hidden = false;
    status.classList.toggle('is-error', state === 'error');
    status.classList.toggle('is-success', state === 'success');
    status.classList.toggle('is-pending', state === 'pending');
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-booking-trigger]');
    if (trigger) {
      event.preventDefault();
      form.reset();
      status.hidden = true;
      status.textContent = '';
      service.value = trigger.dataset.bookingService || '';
      packageInput.value = trigger.dataset.bookingPackage || '';
      vehicleInput.value = trigger.dataset.bookingVehicle || '';
      dateInput.min = today;
      dialog.showModal();
      form.elements.name.focus();
      return;
    }

    if (event.target.closest('[data-booking-close]')) dialog.close();
  });

  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) dialog.close();
  });

  phoneInput.addEventListener('input', validatePhone);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    validatePhone();
    if (!form.reportValidity()) return;

    var endpoint = form.dataset.endpoint.trim();
    if (!endpoint) {
      showStatus('Form chưa được kết nối với hệ thống đặt lịch. Thông tin chưa được gửi; vui lòng gọi 0913 047 775 để đặt lịch.', 'error');
      return;
    }

    var payload = Object.fromEntries(new FormData(form).entries());
    var submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;
    showStatus('Đang gửi yêu cầu đặt lịch...', 'pending');

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (response) {
      if (!response.ok) throw new Error('Máy chủ phản hồi HTTP ' + response.status + '.');
      showStatus('Đã gửi yêu cầu đặt lịch. Chúng tôi sẽ liên hệ xác nhận với bạn.', 'success');
      form.reset();
      dateInput.min = today;
    }).catch(function (error) {
      showStatus('Không gửi được yêu cầu đặt lịch. ' + error.message + ' Vui lòng thử lại hoặc gọi 0913 047 775.', 'error');
    }).finally(function () {
      submitButton.disabled = false;
    });
  });
}());
