var table = document.getElementsByTagName('table')[0];
var rows = table.rows;

var grades = {};

var course = undefined;
var course_part = undefined;
var test = undefined;
for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (row.cells[0].classList.value == 'bigheader') {
        course = row.cells[0].textContent.split(' - ')[0];
        continue;
    }
    if (row.cells[0].classList.value == "odd" || row.cells[0].classList.value == "edge") {
        course_part = row.cells[0].innerText.split('\n')[0];
        continue;
    }
    if (course && course_part) {
        test = {
            date: row.cells[0].textContent,
            name: row.cells[1].textContent,
            moyenneClasse: row.cells[2].textContent,
            coef: row.cells[3].textContent,
            mark: row.cells[4].textContent
        }
    }
    if (!grades[[course, course_part]]) {
        grades[[course, course_part]] = [];
    }
    grades[[course, course_part]].push(test);
}

console.log(grades);