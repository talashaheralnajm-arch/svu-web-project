var DAY_MS = 24 * 60 * 60 * 1000;
var DISCOUNT_FROM_DAYS = 7;
var DISCOUNT_RATE = 0.10;
var FIELD_IDS = ["fullName", "nationalId", "startDate", "endDate", "mobile", "email"];

function fieldValue(id) {
  return $("#" + id).val().trim();
}

function parseDate(str) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (m === null) {
    return null;
  }
  var y = parseInt(m[1], 10);
  var mo = parseInt(m[2], 10);
  var d = parseInt(m[3], 10);
  var date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

function formatMoney(n) {
  return Math.round(n).toLocaleString("en-US") + " ل.س";
}

var RULES = {
  fullName: function (v) {
    if (v === "") {
      return "";
    }
    if (!/^[ء-ي]+(\s+[ء-ي]+)+$/.test(v)) {
      return "الاسم يجب أن يتكون من أحرف عربية فقط (الاسم والكنية)";
    }
    return "";
  },

  nationalId: function (v) {
    if (v === "") {
      return "الرقم الوطني إلزامي";
    }
    if (!/^\d{11}$/.test(v)) {
      return "الرقم الوطني يجب أن يتكون من 11 رقماً";
    }
    var gov = parseInt(v.substring(0, 2), 10);
    if (gov < 1 || gov > 14) {
      return "أول رقمين يجب أن يكونا بين 01 و 14";
    }
    return "";
  },

  startDate: function (v) {
    if (v === "") {
      return "تاريخ بداية التأجير إلزامي";
    }
    if (parseDate(v) === null) {
      return "أدخل تاريخاً صحيحاً بصيغة yyyy-mm-dd";
    }
    return "";
  },

  endDate: function (v) {
    if (v === "") {
      return "تاريخ نهاية التأجير إلزامي";
    }
    var end = parseDate(v);
    if (end === null) {
      return "أدخل تاريخاً صحيحاً بصيغة yyyy-mm-dd";
    }
    var start = parseDate(fieldValue("startDate"));
    if (start !== null && end.getTime() <= start.getTime()) {
      return "تاريخ النهاية يجب أن يكون لاحقاً لتاريخ البداية";
    }
    return "";
  },

  mobile: function (v) {
    if (v === "") {
      return "";
    }
    if (!/^(0|\+963|00963)(93|94|95|96|98|99)\d{7}$/.test(v)) {
      return "رقم غير صحيح، يجب أن يطابق شبكة Syriatel أو MTN";
    }
    return "";
  },

  email: function (v) {
    if (v === "") {
      return "";
    }
    if (!/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(v)) {
      return "صيغة البريد الإلكتروني غير صحيحة";
    }
    return "";
  }
};

function showError(id, message) {
  var input = $("#" + id);
  $("#err-" + id).text(message);
  input.toggleClass("invalid", message !== "");
  input.toggleClass("valid", message === "" && input.val().trim() !== "");
}

function checkField(id) {
  var message = RULES[id](fieldValue(id));
  showError(id, message);
  return message === "";
}

function checkAll() {
  var ok = true;
  $.each(FIELD_IDS, function (i, id) {
    if (!checkField(id)) {
      ok = false;
    }
  });
  return ok;
}

function clearErrors() {
  $(".error").text("");
  $("#bookingForm input").removeClass("invalid valid");
}

function getSelectedCars() {
  var cars = [];
  $(".select-car:checked").each(function () {
    var row = $(this).closest("tr");
    cars.push({
      code: $(this).val(),
      model: row.find(".model").text(),
      price: parseInt(row.find(".price-value").text(), 10)
    });
  });
  return cars;
}

function updateSelection() {
  var cars = getSelectedCars();
  var box = $("#selectedCars").empty();
  $.each(cars, function (i, car) {
    $("<span></span>").addClass("chip").text(car.model + " (" + car.code + ")").appendTo(box);
  });
  $(".car-row").each(function () {
    $(this).toggleClass("selected", $(this).find(".select-car").prop("checked"));
  });
  return cars.length;
}

function sumLine(label, value, extraClass) {
  return "<div class=\"sum-line " + extraClass + "\"><span>" + label + "</span><span>" + value + "</span></div>";
}

function showResult() {
  var start = fieldValue("startDate");
  var end = fieldValue("endDate");
  var days = Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / DAY_MS);
  var cars = getSelectedCars();
  var name = fieldValue("fullName");
  var total = 0;
  var rows = "";

  $.each(cars, function (i, car) {
    var sub = car.price * days;
    total += sub;
    rows += "<tr><td>" + car.model + "</td><td>" + formatMoney(car.price) + "</td><td>" + days + "</td><td>" + formatMoney(sub) + "</td></tr>";
  });

  var discount = days > DISCOUNT_FROM_DAYS ? total * DISCOUNT_RATE : 0;
  var finalAmount = total - discount;

  var html = "<ul class=\"info-list\">";
  html += "<li><strong>الاسم:</strong> " + (name === "" ? "-" : name) + "</li>";
  html += "<li><strong>الرقم الوطني:</strong> " + fieldValue("nationalId") + "</li>";
  html += "<li><strong>من:</strong> " + start + " &nbsp; <strong>إلى:</strong> " + end + "</li>";
  html += "<li><strong>عدد أيام التأجير لكل سيارة:</strong> " + days + "</li>";
  html += "</ul>";
  html += "<table class=\"result-table\"><tr><th>السيارة</th><th>السعر اليومي</th><th>عدد الأيام</th><th>المجموع</th></tr>" + rows + "</table>";
  html += sumLine("المجموع قبل الخصم", formatMoney(total), "");
  html += sumLine(discount > 0 ? "الخصم 10% (مدة التأجير أكثر من 7 أيام)" : "الخصم", "- " + formatMoney(discount), "discount");
  html += sumLine("المبلغ النهائي", formatMoney(finalAmount), "final");

  $("#resultContent").html(html);
  $("#resultOverlay").fadeIn(200);
}

function closeResult() {
  $("#resultOverlay").fadeOut(200);
}

$(document).ready(function () {

  $(".show-details").change(function () {
    var row = $("#details-" + $(this).val());
    var box = row.find(".details-box");
    box.stop(true, true);
    if (this.checked) {
      row.show();
      box.slideDown(250);
    } else {
      box.slideUp(250, function () {
        row.hide();
      });
    }
  });

  $(".select-car").change(function () {
    var count = updateSelection();
    if (count === 0) {
      $("#bookingSection").slideUp(200);
    } else {
      $("#carsMsg").text("");
    }
  });

  $("#continueBtn").click(function () {
    if (updateSelection() === 0) {
      $("#carsMsg").text("الرجاء اختيار سيارة واحدة على الأقل قبل المتابعة");
      $("#bookingSection").slideUp(200);
      return;
    }
    $("#carsMsg").text("");
    $("#bookingSection").slideDown(300, function () {
      $("html, body").animate({ scrollTop: $("#bookingSection").offset().top - 20 }, 300);
      $("#fullName").focus();
    });
  });

  $("#nationalId").on("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "").substring(0, 11);
  });

  $("#mobile").on("input", function () {
    this.value = this.value.replace(/[^0-9+]/g, "");
  });

  $(".date-input").on("input", function () {
    var d = this.value.replace(/[^0-9]/g, "").substring(0, 8);
    if (d.length > 6) {
      d = d.substring(0, 4) + "-" + d.substring(4, 6) + "-" + d.substring(6);
    } else if (d.length > 4) {
      d = d.substring(0, 4) + "-" + d.substring(4);
    }
    this.value = d;
  });

  $("#bookingForm input[type='text']").on("blur", function () {
    checkField(this.id);
  });

  $("#startDate").on("blur", function () {
    if (fieldValue("endDate") !== "") {
      checkField("endDate");
    }
  });

  $("#bookingForm").on("reset", function () {
    setTimeout(clearErrors, 0);
  });

  $("#bookingForm").submit(function (event) {
    event.preventDefault();
    if (getSelectedCars().length === 0) {
      $("#carsMsg").text("الرجاء اختيار سيارة واحدة على الأقل قبل المتابعة");
      return;
    }
    if (checkAll()) {
      showResult();
    } else {
      $("#bookingForm .invalid").first().focus();
    }
  });

  $("#closeResult").click(closeResult);

  $("#resultOverlay").click(function (event) {
    if (event.target === this) {
      closeResult();
    }
  });

  $(document).keydown(function (event) {
    if (event.which === 27) {
      closeResult();
    }
  });
});
