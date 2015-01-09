using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using ClassLibrary1;

namespace WebApplication1.Controllers.WebAPI
{
	public class MovieController : ApiController
	{
		private readonly MovieDbContext _db;

		public MovieController()
		{
			_db = new MovieDbContext();
		}

		protected override void Dispose(bool disposing)
		{
			if (disposing)
			{
				_db.Dispose();
			}

			base.Dispose(disposing);
		}

		// GET: api/Movie
		public async Task<IHttpActionResult> Get()
		{
			return Ok(await _db.Movies.ToListAsync());
		}

		// GET: api/Movie/5
		public async Task<IHttpActionResult> Get(int id)
		{
			var movie = await _db.Movies.FindAsync(id);
			if (movie == null)
			{
				return NotFound();
			}
			return Ok(movie);
		}

		//// POST: api/Movie
		//public void Post([FromBody]string value)
		//{
		//}

		// PUT: api/Movie/5
		public async Task<IHttpActionResult> Put(int id, Movie movie)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(ModelState);
			}

			if (id != movie.Id)
			{
				return BadRequest();
			}

			// await find movie
			// await update movie

			return StatusCode(HttpStatusCode.NoContent);
		}

		//// DELETE: api/Movie/5
		//public void Delete(int id)
		//{
		//}
	}
}
