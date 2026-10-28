(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const norm = s => (s || "").replace(/\s+/g, " ").trim();

  const visible = el => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 &&
      s.display !== "none" && s.visibility !== "hidden";
  };

  const labels = el => [
    el.getAttribute("aria-label"),
    el.getAttribute("title"),
    el.getAttribute("data-tooltip-content"),
    el.innerText
  ].map(norm).filter(Boolean);

  const elements = () => [
    ...document.querySelectorAll(
      'button, [role="button"], a, [aria-label], [title], [data-tooltip-content]'
    )
  ].filter(visible);

  const isShare = el => labels(el).some(s =>
    /^share\s*,\s*[\d,.]+\s*[km]?\s+shares?/i.test(s) ||
    /^share$/i.test(s) ||
    /^chia sẻ$/i.test(s)
  );

  const findShareNow = () => elements().find(el =>
    el.matches('button, [role="button"]') &&
    labels(el).some(s =>
      /^share now$/i.test(s) || /^chia sẻ ngay$/i.test(s)
    )
  );

  window.stopShareLoop = false;
  window.stopShareLoopNow = () => {
    window.stopShareLoop = true;
    console.log("Đã yêu cầu dừng.");
  };

  console.log("Đã bắt đầu vòng lặp KHÔNG ĐỢI. Để dừng, gõ: stopShareLoopNow()");

  let i = 1;
  while (!window.stopShareLoop) {
    console.log(`Lượt ${i}`);

    const all = elements().filter(isShare);
    const candidates = all.filter(el =>
      !all.some(other =>
        other !== el &&
        other.contains(el) &&
        labels(other).some(s => labels(el).includes(s))
      )
    );

    if (!candidates.length) {
      console.warn("Không tìm thấy nút Share.");
      break;
    }

    // Nhấn nút Share
    candidates[0].click();

    let submit = null;
    // Kiểm tra nhanh mỗi 50ms xem bảng Share now xuất hiện chưa
    for (let j = 0; j < 20; j++) {
      if (window.stopShareLoop) break;
      await sleep(50);
      submit = findShareNow();
      if (submit) break;
    }

    if (window.stopShareLoop) break;

    if (!submit) {
      console.warn("Không tìm thấy Share now.");
      break;
    }

    // Nhấn Share now ngay lập tức
    submit.click();
    console.log(`Đã nhấn Share now lượt ${i}.`);

    if (window.stopShareLoop) break;

    // Cuộn xuống lập tức
    window.scrollBy({
      top: Math.floor(window.innerHeight * 0.8),
      behavior: "instant"
    });

    // Nghỉ cực ngắn (50ms) để nhường luồng xử lý DOM
    await sleep(50);
    i++;
  }

  console.log("Đã kết thúc vòng lặp.");
})();
