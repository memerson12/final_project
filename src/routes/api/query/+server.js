import { json } from '@sveltejs/kit';
import { connect } from '$lib/db/database.js';

const RES_LIMIT = 50;

/** @type {import ('./$types').RequestHandler} */
export async function GET({ url }) {
	const connection = await connect();
	let queryParams = [];
	let queries = [];
	let termQuery = 'terms_available LIKE ? ';
	if (url.searchParams.get('term').length > 0) {
		let term = url.searchParams.get('term');
		let terms = term.split(',');
		let tQ = [];
		for (let t of terms) {
			tQ.push(termQuery);
			queryParams.push(`%${t}%`);
		}
		queries.push(`(${tQ.join('OR ')}) `);
	}
	let sQuery = '(course_title LIKE ? OR course_number LIKE ?) ';
	if (url.searchParams.get('searchQuery').length > 0) {
		queryParams.push(`%${url.searchParams.get('searchQuery')}%`);
		queryParams.push(`%${url.searchParams.get('searchQuery')}%`);
		queries.push(sQuery);
	}
	let subjectQuery = 'subject_abbreviation LIKE ? ';
	if (url.searchParams.get('subjects').length > 0) {
		let param = url.searchParams.get('subjects');
		let subjects = param.split(',');
		let subjectsQuery = [];
		for (let subject of subjects) {
			subjectsQuery.push(subjectQuery);
			queryParams.push(`%${subject}%`);
		}
		queries.push(`(${subjectsQuery.join('OR ')}) `);
	}
	let search =
		'SELECT course_title, course_number, subject, overall_average_rating, overall_average_grade, overall_average_work FROM course_overviews';
	// 'SELECT course_title, course_number, subject FROM courses  GROUP BY course_title, course_number, subject';
	// console.log(queryParams.length)
	// console.log(search);
	if (queryParams.length > 0) {
		search =
			'SELECT course_title, course_number, subject, overall_average_rating, overall_average_grade, overall_average_work FROM course_overviews WHERE ' +
			queries.join('AND ');
	}

	//add limit to query
	search += ` LIMIT ${RES_LIMIT}`;
	if (url.searchParams.get('offset').length > 0) {
		search += ` OFFSET ${url.searchParams.get('offset')}`
	}
	// let metaParams = []
	// for (const [key, value] of url.searchParams) {
	// 	if (key === 'offset') {
	// 		metaParams.push(`offset=${parseInt(url.searchParams.get('offset')) + RES_LIMIT}`)
	// 	} else {
	// 		metaParams.push(`${key}=${value}`)
	// 	}
	// .map(param => {
	// 	console.log(param)
	// })
	let __metadata = {
		'offsets': {
			'next': parseInt(url.searchParams.get('offset')) + RES_LIMIT,
			'current': parseInt(url.searchParams.get('offset')),
			'previous': parseInt(url.searchParams.get('offset')) - RES_LIMIT > 0 ? parseInt(url.searchParams.get('offset')) - RES_LIMIT : 0
		}
	}
	// console.log(url)
	// console.log(__metadata)
	// console.log(search);
	// console.log(queryParams);
	// console.log(search)
	// console.log(queryParams)
	let [rows] = await connection.execute(search, queryParams);
	// console.log(rows)
	return json({ '__metadata': __metadata, 'courses': rows });
}
