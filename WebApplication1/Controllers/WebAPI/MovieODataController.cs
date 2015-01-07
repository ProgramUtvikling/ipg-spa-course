using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.ModelBinding;
using System.Web.Http.OData;
using System.Web.Http.OData.Routing;
using ClassLibrary1;

namespace WebApplication1.Controllers.WebAPI
{
    /*
    The WebApiConfig class may require additional changes to add a route for this controller. Merge these statements into the Register method of the WebApiConfig class as applicable. Note that OData URLs are case sensitive.

    using System.Web.Http.OData.Builder;
    using System.Web.Http.OData.Extensions;
    using ClassLibrary1;
    ODataConventionModelBuilder builder = new ODataConventionModelBuilder();
    builder.EntitySet<Movie>("MovieOData");
    config.Routes.MapODataServiceRoute("odata", "odata", builder.GetEdmModel());
    */
    public class MovieODataController : ODataController
    {
        private MovieDbContext db = new MovieDbContext();

        // GET: odata/MovieOData
        [EnableQuery]
        public IQueryable<Movie> GetMovieOData()
        {
            return db.Movies;
        }

        // GET: odata/MovieOData(5)
        [EnableQuery]
        public SingleResult<Movie> GetMovie([FromODataUri] int key)
        {
            return SingleResult.Create(db.Movies.Where(movie => movie.Id == key));
        }

        // PUT: odata/MovieOData(5)
        public async Task<IHttpActionResult> Put([FromODataUri] int key, Delta<Movie> patch)
        {
            Validate(patch.GetEntity());

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            Movie movie = await db.Movies.FindAsync(key);
            if (movie == null)
            {
                return NotFound();
            }

            patch.Put(movie);

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MovieExists(key))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return Updated(movie);
        }

        // POST: odata/MovieOData
        public async Task<IHttpActionResult> Post(Movie movie)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            db.Movies.Add(movie);
            await db.SaveChangesAsync();

            return Created(movie);
        }

        // PATCH: odata/MovieOData(5)
        [AcceptVerbs("PATCH", "MERGE")]
        public async Task<IHttpActionResult> Patch([FromODataUri] int key, Delta<Movie> patch)
        {
            Validate(patch.GetEntity());

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            Movie movie = await db.Movies.FindAsync(key);
            if (movie == null)
            {
                return NotFound();
            }

            patch.Patch(movie);

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MovieExists(key))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return Updated(movie);
        }

        // DELETE: odata/MovieOData(5)
        public async Task<IHttpActionResult> Delete([FromODataUri] int key)
        {
            Movie movie = await db.Movies.FindAsync(key);
            if (movie == null)
            {
                return NotFound();
            }

            db.Movies.Remove(movie);
            await db.SaveChangesAsync();

            return StatusCode(HttpStatusCode.NoContent);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        private bool MovieExists(int key)
        {
            return db.Movies.Count(e => e.Id == key) > 0;
        }
    }
}
