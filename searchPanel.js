const results = document.getElementById('results');
document.getElementById('search').addEventListener('input', (e) => {
    results.innerHTML = '';
    allChurchesSearchArr
        .filter((el) => {
            if (~el.title.toLowerCase().indexOf(e.target.value.toLowerCase())) {
                const li = document.createElement('li');
                li.innerHTML = '<a href="' + el.link + '">' + el.title + '</a>';
                results.appendChild(li);

            }
        });

});
