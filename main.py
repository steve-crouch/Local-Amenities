import logging
import os
import csv
import webapp2
import jinja2
import json
import urllib
import logging
logging.getLogger().setLevel(logging.DEBUG)

from google.appengine.ext import db
from math import radians, cos, sin, asin, sqrt
from models import *
from google.appengine.api import app_identity
from google.appengine.api import users
from google.appengine.api import search
from google.appengine.ext.webapp.util import login_required

AVG_EARTH_RADIUS = 3956  # in mi

#set jinja2 environment to connect html with python
jinja_environment = jinja2.Environment(autoescape=True,
                                       loader=jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__),
                                                                                   'templates')))
																				   
#Render the main page of the application
# GAE Users service reference - https://cloud.google.com/appengine/docs/python/gettingstartedpython27/usingusers
class MainPage(webapp2.RequestHandler):
    def get(self):
        current_user = users.get_current_user()
        if current_user:
            url = users.create_logout_url(self.request.uri)
            url_text = 'Logout'
        else:
            url = users.create_login_url(self.request.uri)
            url_text = 'Login'

        template_values = {
            'url': url,
            'url_text': url_text
        }
        # deal with static files
        template = jinja_environment.get_template('index.html')
        self.response.write(template.render(template_values))
		
#Render new search page
class NewSearch(webapp2.RequestHandler):
	@login_required
	def get(self):
		current_user = users.get_current_user()
		if current_user:
			current_user = users.get_current_user().nickname()
			url = users.create_logout_url('/')
			url_text = 'Logout'
			
		template_values = {'user_nickname': current_user, 'url': url, 'url_text': url_text}
		template = jinja_environment.get_template('search.html')
		self.response.write(template.render(template_values))
		
# Process entered postcode. 
class ProcessPostCode(webapp2.RequestHandler):
	def post(self):
		lat_long = (0.00, 0.00)
		uPostcode = self.request.get('postcode').upper().strip()
		tPostcode = uPostcode.replace(' ','')
		logging.info(tPostcode)
		
		lat_long = self.AccessOutcodes(tPostcode)
		if(lat_long == (0.00, 0.00)):
			lat_long = self.AccessPostcodes(tPostcode)
			if(lat_long == (0.00, 0.00)):
				self.response.out.write(json.dumps({'found': False}))
				return
		self.response.out.write(json.dumps({'found': True, 'postcode': tPostcode, 'latitude': lat_long.lat, 'longitude': lat_long.lon}))

	#Function to validate if the user input is a valid area code.
	def AccessOutcodes(self, tPostcode):	
		try:
			lat_long = (0.00, 0.00)
			#construct query
			query = Outcode.gql('WHERE outcode=:1', tPostcode)
			#Check if the postcode exists
			if query.count() !=0  :
				record = query.get()
				lat_long = record.lat_long
				logging.info(lat_long)
			return 	lat_long
		except Exception, e: 
			logging.exception(e)
			self.response.write('\n\nThere was an error running the demo! '
								'Please check the logs for more details.\n')
								
	#Function to validate if the user input is a valid postal code.
	def AccessPostcodes(self, tPostcode):	
		try:
			lat_long = (0.00, 0.00)
			#construct query
			query = Postcode.gql('WHERE postcode=:1', tPostcode)
			#Check if the postcode exists
			if query.count() !=0 :
				record = query.get()
				lat_long = record.lat_long
				logging.info(lat_long)
			return lat_long

		except Exception, e: 
			logging.exception(e)
			self.response.write('\n\nThere was an error running the demo! '
								'Please check the logs for more details.\n')

# Look up for nearest general practitioner. 
class lookUpGP(webapp2.RequestHandler):
	def post(self):
		gp = []
		postcode = self.request.get('postcode')
		latitude = self.request.get('latitude')
		longitude = self.request.get('longitude')
		logging.info(postcode)
		logging.info(latitude)
		logging.info(longitude)
		gp = self.AccessGP(postcode, latitude, longitude)
		#logging.info(json.dumps(gp))		
		self.response.out.write(json.dumps(gp))
		
	#Retrieve GP records matching the area code.
	def AccessGP(self, postcode, latitude, longitude):
		try:
			gp =[]
			dist = 0.00
			point1 =(float(latitude), float(longitude))
			start = str(postcode[0:2])
			logging.info(start)
			query = GP.all()
			query.filter("postcode >=", start).filter("postcode <", start + "\uFFFD")
			logging.info(query.count())
			records = query.run(batch_size=1000)
			for record in records:
				if record.lat_long != (0.00, 0.00) :
					geopoint= record.lat_long
					point2 = (geopoint.lat, geopoint.lon)
					dist = haversine(point1, point2)
					address = record.address
					address = address.replace(", , ,",", ")
					address = address.replace(", , ",", ")
					gp.append({'name': record.name, 'address' : address, 'postcode': record.postcode, 'latitude': geopoint.lat, 'longitude': geopoint.lon, 'distance': dist})
			return  gp

		except Exception, e: 
			logging.exception(e)
			self.response.write('\n\nThere was an error running the demo! '
								'Please check the logs for more details.\n')

# Haversine function reference - https://pypi.python.org/pypi/haversine
# Calculate distance between two pairs of lat-lon values								
def haversine(point1, point2):
	# unpack latitude/longitude
	lat1, lng1 = point1
	lat2, lng2 = point2

	# convert all latitudes/longitudes from decimal degrees to radians
	lat1, lng1, lat2, lng2 = list(map(radians, [lat1, lng1, lat2, lng2]))

	# calculate haversine
	lat = lat2 - lat1
	lng = lng2 - lng1
	d = sin(lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(lng / 2) ** 2
	h = 2 * AVG_EARTH_RADIUS * asin(sqrt(d))
	return round(h, 2)
		
# Look up for nearest train station. 
class lookUpTrainStation(webapp2.RequestHandler):
	def post(self):
		gp = []
		postcode = self.request.get('postcode')
		latitude = self.request.get('latitude')
		longitude = self.request.get('longitude')
		logging.info(postcode)
		logging.info(latitude)
		logging.info(longitude)
		gp = self.AccessTrainStation(postcode, latitude, longitude)
		#logging.info(json.dumps(gp))		
		self.response.out.write(json.dumps(gp))
	
	#Retrieve train station records matching the area code.
	def AccessTrainStation(self, postcode, latitude, longitude):
		try:
			trainStation =[]
			dist = 0.00
			point1 =(float(latitude), float(longitude))
			records = TrainStation.all().run(batch_size=2700)
			for record in records:
				if record.lat_long != (0.00, 0.00) :
					geopoint= record.lat_long
					point2 = (geopoint.lat, geopoint.lon)
					dist = haversine(point1, point2)
					if dist <= 5 :
						trainStation.append({'name': record.name, 'latitude': geopoint.lat, 'longitude': geopoint.lon, 'distance': dist})
			return  trainStation

		except Exception, e: 
			logging.exception(e)
			self.response.write('\n\nThere was an error running the demo! '
								'Please check the logs for more details.\n')
								
# Look up for nearest supermarkets. 
class lookUpSupermarket(webapp2.RequestHandler):
	def post(self):
		supermarket = []
		postcode = self.request.get('postcode')
		latitude = self.request.get('latitude')
		longitude = self.request.get('longitude')
		logging.info(postcode)
		logging.info(latitude)
		logging.info(longitude)
		supermarket = self.AccessSupermarket(postcode, latitude, longitude)	
		#logging.info(json.dumps(supermarket))
		self.response.out.write(json.dumps(supermarket))
	
	#Retrieve supermarket records matching the area code.
	def AccessSupermarket(self, postcode, latitude, longitude):
		try:
			supermarket =[]
			dist = 0.00
			point1 =(float(latitude), float(longitude))
			start = str(postcode[0:2])
			logging.info(start)
			query = Supermarket.all()
			query.filter("postcode >=", start).filter("postcode <", start + "\uFFFD")
			logging.info(query.count())
			records = query.run(batch_size=1000)
			for record in records:
				if record.lat_long != (0.00, 0.00) :
					geopoint= record.lat_long
					point2 = (geopoint.lat, geopoint.lon)
					dist = haversine(point1, point2)
					address = record.address
					address = address.replace(", , ,",", ")
					address = address.replace(", , ",", ")
					supermarket.append({'name': record.name, 'address' : address, 'postcode': record.postcode, 'latitude': geopoint.lat, 'longitude': geopoint.lon, 'distance': dist})
			return  supermarket

		except Exception, e: 
			logging.exception(e)
			self.response.write('\n\nThere was an error running the demo! '
								'Please check the logs for more details.\n')

# Look up for nearest schools. 
class lookUpSchool(webapp2.RequestHandler):
	def post(self):
		school = []
		postcode = self.request.get('postcode')
		latitude = self.request.get('latitude')
		longitude = self.request.get('longitude')
		logging.info(postcode)
		logging.info(latitude)
		logging.info(longitude)
		school = self.AccessSchool(postcode, latitude, longitude)	
		#logging.info(json.dumps(school))
		self.response.out.write(json.dumps(school))
	
	#Retrieve school records matching the area code.
	def AccessSchool(self, postcode, latitude, longitude):
		try:
			school =[]
			dist = 0.00
			point1 =(float(latitude), float(longitude))
			start = str(postcode[0:2])
			logging.info(start)
			query = School.all()
			query.filter("postcode >=", start).filter("postcode <", start + "\uFFFD")
			logging.info(query.count())
			records = query.run(batch_size=1000)
			for record in records:
				if record.lat_long != (0.00, 0.00) :
					geopoint= record.lat_long
					point2 = (geopoint.lat, geopoint.lon)
					dist = haversine(point1, point2)
					address = record.address
					address = address.replace(", , ,",", ")
					address = address.replace(", , ",", ")
					school.append({'name': record.name, 'address' : address, 'postcode': record.postcode, 'latitude': geopoint.lat, 'longitude': geopoint.lon, 'distance': dist})
			return  school

		except Exception, e: 
			logging.exception(e)
			self.response.write('\n\nThere was an error running the demo! '
								'Please check the logs for more details.\n')
	
#Handles application routes
app = webapp2.WSGIApplication([
    ('/', MainPage),
	('/search', NewSearch),
	('/processPostCode', ProcessPostCode),
	('/lookUpGP', lookUpGP),
	('/lookUpTrainStation', lookUpTrainStation),
	('/lookUpSupermarket', lookUpSupermarket),
	('/lookUpSchool', lookUpSchool)
], debug=True)
	