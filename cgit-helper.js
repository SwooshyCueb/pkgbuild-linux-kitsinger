var pkgbuild_path_var = '_f2fs_path';
var pkgbuild_patch_prefix = '0000-';

function pkgbuild_patch_onclick() {
    patch_fname = this.getAttribute('patch_fname');
    patch_url = this.getAttribute('patch_url');
    navigator.clipboard.writeText(patch_fname + '::' + patch_url);
}

function pkgbuild_cleanup() {
    var pkgbuild_cells = document.querySelectorAll(
        'tr > .pkgbuild_patch, ' +
        'tr > .pkgbuild_patch_header'
    );
    for (const pkgbuild_cell of pkgbuild_cells) {
        var row_idx = pkgbuild_cell.parentElement.rowIndex;
        pkgbuild_cell.remove();
    }

    var pkgbuild_expanded_cells = document.querySelectorAll('tr > .pkgbuild_cell_expanded');

    for (const pkgbuild_cell_expanded of pkgbuild_expanded_cells) {
        pkgbuild_cell_expanded.colSpan = pkgbuild_cell_expanded.colSpan - 1;
        pkgbuild_cell_expanded.classList.remove('pkgbuild_cell_expanded');
    }


}

function pkgbuild_add_columns() {
    const patch_suffix = '.patch';
    const msg_maxlen = 50;

    pkgbuild_cleanup();

    const commit_elems = document.querySelectorAll('#cgit > .content > table.list > tbody > tr:not(.nohover,.nohover-highlight) > td:nth-child(2) > a');

    // if commit_elems empty, bail
    if (commit_elems.length <= 0) {
        console.log('commit_elems empty.');
        return;
    }

    const commit_table = commit_elems[0].parentElement.parentElement.parentElement.parentElement;

    const cur_loc = document.location;
    // dirname of current url without params
    const repo_url = cur_loc.protocol + '/' + cur_loc.pathname.replace(/[^/]+\/?$/, '');

    const new_column = []
    const patch_lines = []

    for (const commit_elem of commit_elems) {
        var cell_elem = commit_elem.parentElement;
        var row_idx = cell_elem.parentElement.rowIndex;
        var commit_msg_raw = commit_elem.text;
        var commit_params = new URLSearchParams(commit_elem.search);
        var commit_id = commit_params.get('id');

        var commit_msg_sanitized = commit_msg_raw
            .replaceAll(/['"]/g, '') // remove single- and dobule-quotes
            .replaceAll(/[^a-zA-Z0-9._]/g , '-') // replace non-title characters with dashes
            .replace(/[.-]+$/ , '') // remove trailing dashes and dots
            .replaceAll(/-+/g , '-') // collapse adjacent dashes
            .substring(0, msg_maxlen) // truncate
            ;

        var patch_fname = pkgbuild_patch_prefix + commit_msg_sanitized + patch_suffix;

        var patch_url;
        // if pkgbuild_path_var not defined, use full patch url
        if (typeof pkgbuild_path_var == 'undefined') {
            patch_url = repo_url + 'patch/';
        } else {
            patch_url = '${' + pkgbuild_path_var + '}';
        }
        // add commit id
        patch_url = patch_url + '?id=' + commit_id;

        patch_lines.unshift('\t\t"' + patch_fname + '::' + patch_url + '"');

        var patch_cell = document.createElement('td');
        patch_cell.innerText = commit_msg_sanitized;
        patch_cell.classList.add('pkgbuild_patch');
        patch_cell.classList.add('logmsg')
        patch_cell.setAttribute('patch_fname', patch_fname);
        patch_cell.setAttribute('patch_url', patch_url);
        patch_cell.onclick = pkgbuild_patch_onclick;

        new_column[row_idx] = patch_cell
    }

    const expected_commit_col_qty = commit_elems[0].parentElement.parentElement.childElementCount;
    var commit_table_header_last_cell = document.querySelector(
        '#cgit > .content > table.list > * > tr > :nth-child(' + expected_commit_col_qty +'):last-child'
    );
    if (commit_table_header_last_cell == null) {
        console.log('could not find header row');
    } else {
        var commit_table_header = commit_table_header_last_cell.parentElement;
        var row_idx = commit_table_header.rowIndex;
        var msg_column_header = commit_table_header.children[2];

        var patch_column_header = document.createElement(msg_column_header.tagName);
        patch_column_header.className = msg_column_header.className;
        patch_column_header.classList.add('pkgbuild_patch_header');
        patch_column_header.innerText = 'PKGBUILD Patch';
        new_column[row_idx] = patch_column_header;
    }

    for (const commit_row of commit_table.rows) {
        var row_idx = commit_row.rowIndex;
        var new_cell = new_column[row_idx];

        if (new_cell == undefined) {
            var expanding_cell;
            if (commit_row.childElementCount > 1) {
                expanding_cell = commit_row.children[1]
            } else if (commit_row.childElementCount == 1 && commit_row.children[0].colSpan > 1) {
                expanding_cell = commit_row.children[0]
            }
            if (expanding_cell != undefined) {
                expanding_cell.colSpan = expanding_cell.colSpan + 1;
                expanding_cell.classList.add('pkgbuild_cell_expanded');
            }
        } else {
            commit_row.children[1].after(new_cell);
        }
    }

    console.log(patch_lines.join('\n'));

}

pkgbuild_add_columns();
