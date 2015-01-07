namespace ClassLibrary1.Migrations
{
    using System;
    using System.Data.Entity;
    using System.Data.Entity.Migrations;
    using System.Linq;

    internal sealed class Configuration : DbMigrationsConfiguration<ClassLibrary1.MovieDbContext>
    {
        public Configuration()
        {
            AutomaticMigrationsEnabled = false;
        }

        protected override void Seed(ClassLibrary1.MovieDbContext context)
        {
			context.Movies.AddOrUpdate(
			  p => p.Title,
				new Movie
				{
					Title = "Spaceballs",
					ProductionYear = 1987,
					RunningLength = 96,
					Vote = 0
				},
				new Movie
				{
					Title = "Kopps",
					ProductionYear = 2003,
					RunningLength = 90,
					Vote = 0
				},
				new Movie
				{
					Title = "Legally Blonde",
					ProductionYear = 2001,
					RunningLength = 96,
					Vote = 0
				},
				new Movie
				{
					Title = "Børning",
					ProductionYear = 2014,
					RunningLength = 89,
					Vote = 0
				},
				new Movie
				{
					Title = "Taxi",
					ProductionYear = 1998,
					RunningLength = 86,
					Vote = 0
				},
				new Movie
				{
					Title = "Gravity",
					ProductionYear = 2014,
					RunningLength = 91,
					Vote = 0
				}
			);
            
        }
    }
}
