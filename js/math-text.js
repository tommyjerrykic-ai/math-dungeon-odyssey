/* 將題庫內常見的 √2、√(12+4)、1/3 排成學生熟悉的數學式。 */
(function () {
  var M = GAME.MathText = {};
  var mathToken = /√\(([^()]+)\)|√([A-Za-z0-9]+(?:\.[0-9]+)?)|(\d+)\/(\d+)/g;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  M.toHTML = function (value) {
    var source = String(value), result = "", last = 0, match;
    mathToken.lastIndex = 0;
    while ((match = mathToken.exec(source))) {
      result += escapeHtml(source.slice(last, match.index));
      if (match[1] !== undefined || match[2] !== undefined) {
        var radicand = match[1] !== undefined ? match[1] : match[2];
        result += '<span class="math-sqrt" role="math" aria-label="根號 ' + escapeHtml(radicand) + '">' +
          '<span class="math-radical" aria-hidden="true">√</span>' +
          '<span class="math-radicand" aria-hidden="true">' + escapeHtml(radicand) + '</span></span>';
      } else {
        result += '<span class="math-frac" role="math" aria-label="' + escapeHtml(match[4]) + ' 分之 ' + escapeHtml(match[3]) + '">' +
          '<span class="math-numerator" aria-hidden="true">' + escapeHtml(match[3]) + '</span>' +
          '<span class="math-denominator" aria-hidden="true">' + escapeHtml(match[4]) + '</span></span>';
      }
      last = mathToken.lastIndex;
    }
    return result + escapeHtml(source.slice(last));
  };
})();
