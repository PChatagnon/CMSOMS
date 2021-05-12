import { stringFormatter, toUrlQuery } from './utils';

test('Testing stringFormatter utility which injects values into a string', () => {
    expect(
        stringFormatter('/cms/run/report?cms_run=%&cms_run_sequence=%', ['319123', 'GLOBAL-RUN'])
    ).toBe('/cms/run/report?cms_run=319123&cms_run_sequence=GLOBAL-RUN');
});

test('Testing toUrlQuery utility which strigifies selector queries for url links', () => {
    expect(
        toUrlQuery({ a: { b: { c: 'd', e: 'f' } } })
    ).toBe('?a.b.c=d&a.b.e=f');
});

