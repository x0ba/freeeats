// Comprehensive list of US colleges and universities with coordinates
// Data compiled from IPEDS and public sources

export interface CampusData {
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

export const allCampuses: CampusData[] = [
  // ALABAMA
  { name: "University of Alabama", city: "Tuscaloosa", state: "AL", latitude: 33.2098, longitude: -87.5692 },
  { name: "Auburn University", city: "Auburn", state: "AL", latitude: 32.6010, longitude: -85.4876 },
  { name: "University of Alabama at Birmingham", city: "Birmingham", state: "AL", latitude: 33.5021, longitude: -86.8064 },
  { name: "University of South Alabama", city: "Mobile", state: "AL", latitude: 30.6944, longitude: -88.1780 },
  { name: "Alabama A&M University", city: "Huntsville", state: "AL", latitude: 34.7825, longitude: -86.5686 },
  { name: "Troy University", city: "Troy", state: "AL", latitude: 31.7988, longitude: -85.9658 },
  { name: "Samford University", city: "Birmingham", state: "AL", latitude: 33.4632, longitude: -86.7916 },
  { name: "University of Alabama in Huntsville", city: "Huntsville", state: "AL", latitude: 34.7254, longitude: -86.6403 },
  
  // ALASKA
  { name: "University of Alaska Anchorage", city: "Anchorage", state: "AK", latitude: 61.1900, longitude: -149.8194 },
  { name: "University of Alaska Fairbanks", city: "Fairbanks", state: "AK", latitude: 64.8591, longitude: -147.8481 },
  { name: "University of Alaska Southeast", city: "Juneau", state: "AK", latitude: 58.3816, longitude: -134.6345 },
  
  // ARIZONA
  { name: "Arizona State University", city: "Tempe", state: "AZ", latitude: 33.4255, longitude: -111.9400 },
  { name: "University of Arizona", city: "Tucson", state: "AZ", latitude: 32.2319, longitude: -110.9501 },
  { name: "Northern Arizona University", city: "Flagstaff", state: "AZ", latitude: 35.1894, longitude: -111.6553 },
  { name: "Grand Canyon University", city: "Phoenix", state: "AZ", latitude: 33.5073, longitude: -112.1256 },
  { name: "Arizona State University - West", city: "Glendale", state: "AZ", latitude: 33.5387, longitude: -112.1860 },
  { name: "Embry-Riddle Aeronautical University", city: "Prescott", state: "AZ", latitude: 34.6145, longitude: -112.4524 },
  
  // ARKANSAS
  { name: "University of Arkansas", city: "Fayetteville", state: "AR", latitude: 36.0686, longitude: -94.1748 },
  { name: "Arkansas State University", city: "Jonesboro", state: "AR", latitude: 35.8423, longitude: -90.6751 },
  { name: "University of Central Arkansas", city: "Conway", state: "AR", latitude: 35.0786, longitude: -92.4605 },
  { name: "University of Arkansas at Little Rock", city: "Little Rock", state: "AR", latitude: 34.7243, longitude: -92.3439 },
  { name: "Hendrix College", city: "Conway", state: "AR", latitude: 35.1006, longitude: -92.4421 },
  
  // CALIFORNIA
  { name: "UCLA", city: "Los Angeles", state: "CA", latitude: 34.0689, longitude: -118.4452 },
  { name: "UC Berkeley", city: "Berkeley", state: "CA", latitude: 37.8719, longitude: -122.2585 },
  { name: "Stanford University", city: "Stanford", state: "CA", latitude: 37.4275, longitude: -122.1697 },
  { name: "USC", city: "Los Angeles", state: "CA", latitude: 34.0224, longitude: -118.2851 },
  { name: "UC San Diego", city: "La Jolla", state: "CA", latitude: 32.8801, longitude: -117.2340 },
  { name: "UC Davis", city: "Davis", state: "CA", latitude: 38.5382, longitude: -121.7617 },
  { name: "UC Irvine", city: "Irvine", state: "CA", latitude: 33.6405, longitude: -117.8443 },
  { name: "UC Santa Barbara", city: "Santa Barbara", state: "CA", latitude: 34.4140, longitude: -119.8489 },
  { name: "UC Santa Cruz", city: "Santa Cruz", state: "CA", latitude: 36.9916, longitude: -122.0583 },
  { name: "UC Riverside", city: "Riverside", state: "CA", latitude: 33.9737, longitude: -117.3281 },
  { name: "UC Merced", city: "Merced", state: "CA", latitude: 37.3660, longitude: -120.4237 },
  { name: "Cal Poly San Luis Obispo", city: "San Luis Obispo", state: "CA", latitude: 35.3050, longitude: -120.6625 },
  { name: "Cal Poly Pomona", city: "Pomona", state: "CA", latitude: 34.0565, longitude: -117.8215 },
  { name: "San Diego State University", city: "San Diego", state: "CA", latitude: 32.7757, longitude: -117.0719 },
  { name: "San Jose State University", city: "San Jose", state: "CA", latitude: 37.3352, longitude: -121.8811 },
  { name: "CSU Long Beach", city: "Long Beach", state: "CA", latitude: 33.7838, longitude: -118.1141 },
  { name: "CSU Fullerton", city: "Fullerton", state: "CA", latitude: 33.8829, longitude: -117.8854 },
  { name: "CSU Northridge", city: "Northridge", state: "CA", latitude: 34.2400, longitude: -118.5291 },
  { name: "CSU Sacramento", city: "Sacramento", state: "CA", latitude: 38.5607, longitude: -121.4240 },
  { name: "Fresno State", city: "Fresno", state: "CA", latitude: 36.8134, longitude: -119.7483 },
  { name: "San Francisco State University", city: "San Francisco", state: "CA", latitude: 37.7219, longitude: -122.4782 },
  { name: "Caltech", city: "Pasadena", state: "CA", latitude: 34.1377, longitude: -118.1253 },
  { name: "Pepperdine University", city: "Malibu", state: "CA", latitude: 34.0366, longitude: -118.7084 },
  { name: "Santa Clara University", city: "Santa Clara", state: "CA", latitude: 37.3496, longitude: -121.9390 },
  { name: "Loyola Marymount University", city: "Los Angeles", state: "CA", latitude: 33.9692, longitude: -118.4181 },
  { name: "University of San Diego", city: "San Diego", state: "CA", latitude: 32.7714, longitude: -117.1880 },
  { name: "University of San Francisco", city: "San Francisco", state: "CA", latitude: 37.7765, longitude: -122.4506 },
  { name: "Chapman University", city: "Orange", state: "CA", latitude: 33.7930, longitude: -117.8514 },
  { name: "CSU Chico", city: "Chico", state: "CA", latitude: 39.7299, longitude: -121.8454 },
  { name: "Humboldt State University", city: "Arcata", state: "CA", latitude: 40.8757, longitude: -124.0786 },
  
  // COLORADO
  { name: "University of Colorado Boulder", city: "Boulder", state: "CO", latitude: 40.0076, longitude: -105.2659 },
  { name: "Colorado State University", city: "Fort Collins", state: "CO", latitude: 40.5734, longitude: -105.0865 },
  { name: "University of Denver", city: "Denver", state: "CO", latitude: 39.6766, longitude: -104.9619 },
  { name: "Colorado School of Mines", city: "Golden", state: "CO", latitude: 39.7512, longitude: -105.2227 },
  { name: "University of Colorado Denver", city: "Denver", state: "CO", latitude: 39.7458, longitude: -105.0076 },
  { name: "University of Colorado Colorado Springs", city: "Colorado Springs", state: "CO", latitude: 38.8934, longitude: -104.8008 },
  { name: "University of Northern Colorado", city: "Greeley", state: "CO", latitude: 40.4053, longitude: -104.6997 },
  { name: "Colorado College", city: "Colorado Springs", state: "CO", latitude: 38.8469, longitude: -104.8252 },
  
  // CONNECTICUT
  { name: "Yale University", city: "New Haven", state: "CT", latitude: 41.3163, longitude: -72.9223 },
  { name: "University of Connecticut", city: "Storrs", state: "CT", latitude: 41.8084, longitude: -72.2495 },
  { name: "Wesleyan University", city: "Middletown", state: "CT", latitude: 41.5565, longitude: -72.6566 },
  { name: "Trinity College", city: "Hartford", state: "CT", latitude: 41.7474, longitude: -72.6910 },
  { name: "Connecticut College", city: "New London", state: "CT", latitude: 41.3793, longitude: -72.1051 },
  { name: "Quinnipiac University", city: "Hamden", state: "CT", latitude: 41.4190, longitude: -72.8932 },
  { name: "Sacred Heart University", city: "Fairfield", state: "CT", latitude: 41.2209, longitude: -73.2387 },
  { name: "University of Hartford", city: "West Hartford", state: "CT", latitude: 41.8002, longitude: -72.7667 },
  
  // DELAWARE
  { name: "University of Delaware", city: "Newark", state: "DE", latitude: 39.6780, longitude: -75.7506 },
  { name: "Delaware State University", city: "Dover", state: "DE", latitude: 39.1874, longitude: -75.5426 },
  
  // FLORIDA
  { name: "University of Florida", city: "Gainesville", state: "FL", latitude: 29.6436, longitude: -82.3549 },
  { name: "Florida State University", city: "Tallahassee", state: "FL", latitude: 30.4419, longitude: -84.2985 },
  { name: "University of Miami", city: "Coral Gables", state: "FL", latitude: 25.7215, longitude: -80.2794 },
  { name: "University of Central Florida", city: "Orlando", state: "FL", latitude: 28.6024, longitude: -81.2001 },
  { name: "University of South Florida", city: "Tampa", state: "FL", latitude: 28.0587, longitude: -82.4139 },
  { name: "Florida International University", city: "Miami", state: "FL", latitude: 25.7563, longitude: -80.3755 },
  { name: "Florida Atlantic University", city: "Boca Raton", state: "FL", latitude: 26.3705, longitude: -80.1013 },
  { name: "Florida Gulf Coast University", city: "Fort Myers", state: "FL", latitude: 26.4645, longitude: -81.7708 },
  { name: "University of North Florida", city: "Jacksonville", state: "FL", latitude: 30.2715, longitude: -81.5106 },
  { name: "Florida A&M University", city: "Tallahassee", state: "FL", latitude: 30.4257, longitude: -84.2889 },
  { name: "Stetson University", city: "DeLand", state: "FL", latitude: 29.0349, longitude: -81.3034 },
  { name: "Rollins College", city: "Winter Park", state: "FL", latitude: 28.5960, longitude: -81.3496 },
  { name: "University of Tampa", city: "Tampa", state: "FL", latitude: 27.9467, longitude: -82.4651 },
  { name: "Nova Southeastern University", city: "Fort Lauderdale", state: "FL", latitude: 26.0772, longitude: -80.2467 },
  
  // GEORGIA
  { name: "Georgia Tech", city: "Atlanta", state: "GA", latitude: 33.7756, longitude: -84.3963 },
  { name: "University of Georgia", city: "Athens", state: "GA", latitude: 33.9480, longitude: -83.3773 },
  { name: "Emory University", city: "Atlanta", state: "GA", latitude: 33.7909, longitude: -84.3263 },
  { name: "Georgia State University", city: "Atlanta", state: "GA", latitude: 33.7530, longitude: -84.3853 },
  { name: "Kennesaw State University", city: "Kennesaw", state: "GA", latitude: 34.0380, longitude: -84.5806 },
  { name: "Georgia Southern University", city: "Statesboro", state: "GA", latitude: 32.4226, longitude: -81.7831 },
  { name: "Augusta University", city: "Augusta", state: "GA", latitude: 33.4735, longitude: -82.0105 },
  { name: "Mercer University", city: "Macon", state: "GA", latitude: 32.8301, longitude: -83.6499 },
  { name: "Spelman College", city: "Atlanta", state: "GA", latitude: 33.7465, longitude: -84.4132 },
  { name: "Morehouse College", city: "Atlanta", state: "GA", latitude: 33.7474, longitude: -84.4142 },
  { name: "Clark Atlanta University", city: "Atlanta", state: "GA", latitude: 33.7547, longitude: -84.4143 },
  
  // HAWAII
  { name: "University of Hawaii at Manoa", city: "Honolulu", state: "HI", latitude: 21.2969, longitude: -157.8171 },
  { name: "University of Hawaii at Hilo", city: "Hilo", state: "HI", latitude: 19.7003, longitude: -155.0789 },
  { name: "Hawaii Pacific University", city: "Honolulu", state: "HI", latitude: 21.3069, longitude: -157.8583 },
  
  // IDAHO
  { name: "University of Idaho", city: "Moscow", state: "ID", latitude: 46.7262, longitude: -117.0145 },
  { name: "Boise State University", city: "Boise", state: "ID", latitude: 43.6036, longitude: -116.2025 },
  { name: "Idaho State University", city: "Pocatello", state: "ID", latitude: 42.8606, longitude: -112.4318 },
  { name: "Brigham Young University-Idaho", city: "Rexburg", state: "ID", latitude: 43.8145, longitude: -111.7833 },
  
  // ILLINOIS
  { name: "University of Illinois Urbana-Champaign", city: "Champaign", state: "IL", latitude: 40.1020, longitude: -88.2272 },
  { name: "Northwestern University", city: "Evanston", state: "IL", latitude: 42.0565, longitude: -87.6753 },
  { name: "University of Chicago", city: "Chicago", state: "IL", latitude: 41.7886, longitude: -87.5987 },
  { name: "University of Illinois Chicago", city: "Chicago", state: "IL", latitude: 41.8719, longitude: -87.6484 },
  { name: "DePaul University", city: "Chicago", state: "IL", latitude: 41.9253, longitude: -87.6556 },
  { name: "Loyola University Chicago", city: "Chicago", state: "IL", latitude: 41.9997, longitude: -87.6581 },
  { name: "Illinois State University", city: "Normal", state: "IL", latitude: 40.5103, longitude: -88.9988 },
  { name: "Southern Illinois University Carbondale", city: "Carbondale", state: "IL", latitude: 37.7173, longitude: -89.2170 },
  { name: "Northern Illinois University", city: "DeKalb", state: "IL", latitude: 41.9344, longitude: -88.7678 },
  { name: "Eastern Illinois University", city: "Charleston", state: "IL", latitude: 39.4797, longitude: -88.1765 },
  { name: "Western Illinois University", city: "Macomb", state: "IL", latitude: 40.4748, longitude: -90.6848 },
  { name: "Illinois Institute of Technology", city: "Chicago", state: "IL", latitude: 41.8349, longitude: -87.6270 },
  
  // INDIANA
  { name: "Indiana University Bloomington", city: "Bloomington", state: "IN", latitude: 39.1653, longitude: -86.5264 },
  { name: "Purdue University", city: "West Lafayette", state: "IN", latitude: 40.4237, longitude: -86.9212 },
  { name: "University of Notre Dame", city: "Notre Dame", state: "IN", latitude: 41.7052, longitude: -86.2353 },
  { name: "Indiana University-Purdue University Indianapolis", city: "Indianapolis", state: "IN", latitude: 39.7742, longitude: -86.1754 },
  { name: "Ball State University", city: "Muncie", state: "IN", latitude: 40.2059, longitude: -85.4086 },
  { name: "Indiana State University", city: "Terre Haute", state: "IN", latitude: 39.4673, longitude: -87.4139 },
  { name: "Butler University", city: "Indianapolis", state: "IN", latitude: 39.8398, longitude: -86.1694 },
  { name: "Valparaiso University", city: "Valparaiso", state: "IN", latitude: 41.4647, longitude: -87.0445 },
  { name: "University of Evansville", city: "Evansville", state: "IN", latitude: 37.9719, longitude: -87.5319 },
  
  // IOWA
  { name: "University of Iowa", city: "Iowa City", state: "IA", latitude: 41.6611, longitude: -91.5302 },
  { name: "Iowa State University", city: "Ames", state: "IA", latitude: 42.0267, longitude: -93.6465 },
  { name: "University of Northern Iowa", city: "Cedar Falls", state: "IA", latitude: 42.5136, longitude: -92.4631 },
  { name: "Drake University", city: "Des Moines", state: "IA", latitude: 41.6046, longitude: -93.6536 },
  { name: "Grinnell College", city: "Grinnell", state: "IA", latitude: 41.7477, longitude: -92.7241 },
  
  // KANSAS
  { name: "University of Kansas", city: "Lawrence", state: "KS", latitude: 38.9543, longitude: -95.2558 },
  { name: "Kansas State University", city: "Manhattan", state: "KS", latitude: 39.1974, longitude: -96.5847 },
  { name: "Wichita State University", city: "Wichita", state: "KS", latitude: 37.7195, longitude: -97.2931 },
  { name: "Emporia State University", city: "Emporia", state: "KS", latitude: 38.4137, longitude: -96.1840 },
  
  // KENTUCKY
  { name: "University of Kentucky", city: "Lexington", state: "KY", latitude: 38.0317, longitude: -84.5040 },
  { name: "University of Louisville", city: "Louisville", state: "KY", latitude: 38.2138, longitude: -85.7585 },
  { name: "Western Kentucky University", city: "Bowling Green", state: "KY", latitude: 36.9871, longitude: -86.4564 },
  { name: "Eastern Kentucky University", city: "Richmond", state: "KY", latitude: 37.7354, longitude: -84.2954 },
  { name: "Murray State University", city: "Murray", state: "KY", latitude: 36.6190, longitude: -88.3256 },
  { name: "Northern Kentucky University", city: "Highland Heights", state: "KY", latitude: 39.0328, longitude: -84.4655 },
  
  // LOUISIANA
  { name: "Louisiana State University", city: "Baton Rouge", state: "LA", latitude: 30.4133, longitude: -91.1800 },
  { name: "Tulane University", city: "New Orleans", state: "LA", latitude: 29.9396, longitude: -90.1210 },
  { name: "University of New Orleans", city: "New Orleans", state: "LA", latitude: 30.0274, longitude: -90.0677 },
  { name: "Louisiana Tech University", city: "Ruston", state: "LA", latitude: 32.5265, longitude: -92.6475 },
  { name: "University of Louisiana at Lafayette", city: "Lafayette", state: "LA", latitude: 30.2133, longitude: -92.0188 },
  { name: "Loyola University New Orleans", city: "New Orleans", state: "LA", latitude: 29.9352, longitude: -90.1227 },
  { name: "Southern University", city: "Baton Rouge", state: "LA", latitude: 30.5177, longitude: -91.1908 },
  
  // MAINE
  { name: "University of Maine", city: "Orono", state: "ME", latitude: 44.9012, longitude: -68.6719 },
  { name: "Bowdoin College", city: "Brunswick", state: "ME", latitude: 43.9069, longitude: -69.9636 },
  { name: "Bates College", city: "Lewiston", state: "ME", latitude: 44.1053, longitude: -70.2026 },
  { name: "Colby College", city: "Waterville", state: "ME", latitude: 44.5639, longitude: -69.6625 },
  
  // MARYLAND
  { name: "University of Maryland", city: "College Park", state: "MD", latitude: 38.9869, longitude: -76.9426 },
  { name: "Johns Hopkins University", city: "Baltimore", state: "MD", latitude: 39.3299, longitude: -76.6205 },
  { name: "Towson University", city: "Towson", state: "MD", latitude: 39.3941, longitude: -76.6106 },
  { name: "University of Maryland Baltimore County", city: "Baltimore", state: "MD", latitude: 39.2557, longitude: -76.7116 },
  { name: "Salisbury University", city: "Salisbury", state: "MD", latitude: 38.3724, longitude: -75.5995 },
  { name: "Morgan State University", city: "Baltimore", state: "MD", latitude: 39.3431, longitude: -76.5835 },
  { name: "United States Naval Academy", city: "Annapolis", state: "MD", latitude: 38.9850, longitude: -76.4867 },
  { name: "Loyola University Maryland", city: "Baltimore", state: "MD", latitude: 39.3510, longitude: -76.6220 },
  
  // MASSACHUSETTS
  { name: "MIT", city: "Cambridge", state: "MA", latitude: 42.3601, longitude: -71.0942 },
  { name: "Harvard University", city: "Cambridge", state: "MA", latitude: 42.3770, longitude: -71.1167 },
  { name: "Boston University", city: "Boston", state: "MA", latitude: 42.3505, longitude: -71.1054 },
  { name: "Boston College", city: "Chestnut Hill", state: "MA", latitude: 42.3355, longitude: -71.1685 },
  { name: "Northeastern University", city: "Boston", state: "MA", latitude: 42.3398, longitude: -71.0892 },
  { name: "Tufts University", city: "Medford", state: "MA", latitude: 42.4085, longitude: -71.1183 },
  { name: "UMass Amherst", city: "Amherst", state: "MA", latitude: 42.3912, longitude: -72.5267 },
  { name: "UMass Boston", city: "Boston", state: "MA", latitude: 42.3132, longitude: -71.0378 },
  { name: "UMass Lowell", city: "Lowell", state: "MA", latitude: 42.6550, longitude: -71.3247 },
  { name: "Brandeis University", city: "Waltham", state: "MA", latitude: 42.3661, longitude: -71.2614 },
  { name: "Williams College", city: "Williamstown", state: "MA", latitude: 42.7137, longitude: -73.2036 },
  { name: "Amherst College", city: "Amherst", state: "MA", latitude: 42.3711, longitude: -72.5170 },
  { name: "Wellesley College", city: "Wellesley", state: "MA", latitude: 42.2936, longitude: -71.3057 },
  { name: "Smith College", city: "Northampton", state: "MA", latitude: 42.3181, longitude: -72.6387 },
  { name: "Worcester Polytechnic Institute", city: "Worcester", state: "MA", latitude: 42.2746, longitude: -71.8063 },
  { name: "College of the Holy Cross", city: "Worcester", state: "MA", latitude: 42.2363, longitude: -71.8087 },
  
  // MICHIGAN
  { name: "University of Michigan", city: "Ann Arbor", state: "MI", latitude: 42.2780, longitude: -83.7382 },
  { name: "Michigan State University", city: "East Lansing", state: "MI", latitude: 42.7018, longitude: -84.4822 },
  { name: "Wayne State University", city: "Detroit", state: "MI", latitude: 42.3573, longitude: -83.0694 },
  { name: "Western Michigan University", city: "Kalamazoo", state: "MI", latitude: 42.2833, longitude: -85.6140 },
  { name: "Central Michigan University", city: "Mount Pleasant", state: "MI", latitude: 43.5925, longitude: -84.7751 },
  { name: "Eastern Michigan University", city: "Ypsilanti", state: "MI", latitude: 42.2505, longitude: -83.6240 },
  { name: "Grand Valley State University", city: "Allendale", state: "MI", latitude: 42.9634, longitude: -85.8894 },
  { name: "Oakland University", city: "Rochester", state: "MI", latitude: 42.6734, longitude: -83.2185 },
  { name: "University of Michigan-Dearborn", city: "Dearborn", state: "MI", latitude: 42.3212, longitude: -83.2324 },
  
  // MINNESOTA
  { name: "University of Minnesota", city: "Minneapolis", state: "MN", latitude: 44.9740, longitude: -93.2277 },
  { name: "University of Minnesota Duluth", city: "Duluth", state: "MN", latitude: 46.8214, longitude: -92.0865 },
  { name: "Minnesota State University Mankato", city: "Mankato", state: "MN", latitude: 44.1461, longitude: -93.9987 },
  { name: "St. Cloud State University", city: "St. Cloud", state: "MN", latitude: 45.5515, longitude: -94.1511 },
  { name: "University of St. Thomas", city: "St. Paul", state: "MN", latitude: 44.9432, longitude: -93.1910 },
  { name: "Macalester College", city: "St. Paul", state: "MN", latitude: 44.9383, longitude: -93.1691 },
  { name: "Carleton College", city: "Northfield", state: "MN", latitude: 44.4606, longitude: -93.1538 },
  
  // MISSISSIPPI
  { name: "University of Mississippi", city: "Oxford", state: "MS", latitude: 34.3650, longitude: -89.5344 },
  { name: "Mississippi State University", city: "Starkville", state: "MS", latitude: 33.4552, longitude: -88.7893 },
  { name: "University of Southern Mississippi", city: "Hattiesburg", state: "MS", latitude: 31.3271, longitude: -89.3325 },
  { name: "Jackson State University", city: "Jackson", state: "MS", latitude: 32.2974, longitude: -90.2089 },
  
  // MISSOURI
  { name: "University of Missouri", city: "Columbia", state: "MO", latitude: 38.9404, longitude: -92.3277 },
  { name: "Washington University in St. Louis", city: "St. Louis", state: "MO", latitude: 38.6488, longitude: -90.3108 },
  { name: "Saint Louis University", city: "St. Louis", state: "MO", latitude: 38.6359, longitude: -90.2341 },
  { name: "Missouri State University", city: "Springfield", state: "MO", latitude: 37.2050, longitude: -93.2818 },
  { name: "University of Missouri-Kansas City", city: "Kansas City", state: "MO", latitude: 39.0331, longitude: -94.5758 },
  { name: "Missouri University of Science and Technology", city: "Rolla", state: "MO", latitude: 37.9537, longitude: -91.7724 },
  
  // MONTANA
  { name: "University of Montana", city: "Missoula", state: "MT", latitude: 46.8625, longitude: -113.9851 },
  { name: "Montana State University", city: "Bozeman", state: "MT", latitude: 45.6677, longitude: -111.0492 },
  
  // NEBRASKA
  { name: "University of Nebraska-Lincoln", city: "Lincoln", state: "NE", latitude: 40.8202, longitude: -96.7005 },
  { name: "University of Nebraska at Omaha", city: "Omaha", state: "NE", latitude: 41.2584, longitude: -96.0100 },
  { name: "Creighton University", city: "Omaha", state: "NE", latitude: 41.2655, longitude: -95.9451 },
  
  // NEVADA
  { name: "University of Nevada Las Vegas", city: "Las Vegas", state: "NV", latitude: 36.1084, longitude: -115.1440 },
  { name: "University of Nevada Reno", city: "Reno", state: "NV", latitude: 39.5439, longitude: -119.8154 },
  
  // NEW HAMPSHIRE
  { name: "University of New Hampshire", city: "Durham", state: "NH", latitude: 43.1348, longitude: -70.9227 },
  { name: "Dartmouth College", city: "Hanover", state: "NH", latitude: 43.7044, longitude: -72.2887 },
  { name: "Southern New Hampshire University", city: "Manchester", state: "NH", latitude: 42.9636, longitude: -71.4525 },
  
  // NEW JERSEY
  { name: "Princeton University", city: "Princeton", state: "NJ", latitude: 40.3431, longitude: -74.6551 },
  { name: "Rutgers University", city: "New Brunswick", state: "NJ", latitude: 40.5008, longitude: -74.4474 },
  { name: "Rutgers University-Newark", city: "Newark", state: "NJ", latitude: 40.7418, longitude: -74.1736 },
  { name: "New Jersey Institute of Technology", city: "Newark", state: "NJ", latitude: 40.7421, longitude: -74.1793 },
  { name: "Seton Hall University", city: "South Orange", state: "NJ", latitude: 40.7424, longitude: -74.2462 },
  { name: "Stevens Institute of Technology", city: "Hoboken", state: "NJ", latitude: 40.7453, longitude: -74.0256 },
  { name: "Montclair State University", city: "Montclair", state: "NJ", latitude: 40.8644, longitude: -74.1994 },
  { name: "Rowan University", city: "Glassboro", state: "NJ", latitude: 39.7092, longitude: -75.1194 },
  
  // NEW MEXICO
  { name: "University of New Mexico", city: "Albuquerque", state: "NM", latitude: 35.0844, longitude: -106.6189 },
  { name: "New Mexico State University", city: "Las Cruces", state: "NM", latitude: 32.2816, longitude: -106.7476 },
  { name: "New Mexico Tech", city: "Socorro", state: "NM", latitude: 34.0665, longitude: -106.9057 },
  
  // NEW YORK
  { name: "Columbia University", city: "New York", state: "NY", latitude: 40.8075, longitude: -73.9626 },
  { name: "New York University", city: "New York", state: "NY", latitude: 40.7295, longitude: -73.9965 },
  { name: "Cornell University", city: "Ithaca", state: "NY", latitude: 42.4534, longitude: -76.4735 },
  { name: "Syracuse University", city: "Syracuse", state: "NY", latitude: 43.0392, longitude: -76.1351 },
  { name: "University at Buffalo", city: "Buffalo", state: "NY", latitude: 43.0008, longitude: -78.7890 },
  { name: "Stony Brook University", city: "Stony Brook", state: "NY", latitude: 40.9126, longitude: -73.1234 },
  { name: "University at Albany", city: "Albany", state: "NY", latitude: 42.6866, longitude: -73.8232 },
  { name: "Binghamton University", city: "Binghamton", state: "NY", latitude: 42.0898, longitude: -75.9677 },
  { name: "Rochester Institute of Technology", city: "Rochester", state: "NY", latitude: 43.0848, longitude: -77.6744 },
  { name: "University of Rochester", city: "Rochester", state: "NY", latitude: 43.1284, longitude: -77.6287 },
  { name: "Fordham University", city: "Bronx", state: "NY", latitude: 40.8614, longitude: -73.8855 },
  { name: "CUNY City College", city: "New York", state: "NY", latitude: 40.8200, longitude: -73.9493 },
  { name: "CUNY Hunter College", city: "New York", state: "NY", latitude: 40.7685, longitude: -73.9657 },
  { name: "CUNY Baruch College", city: "New York", state: "NY", latitude: 40.7404, longitude: -73.9830 },
  { name: "Rensselaer Polytechnic Institute", city: "Troy", state: "NY", latitude: 42.7298, longitude: -73.6789 },
  { name: "Hofstra University", city: "Hempstead", state: "NY", latitude: 40.7147, longitude: -73.6004 },
  { name: "Ithaca College", city: "Ithaca", state: "NY", latitude: 42.4220, longitude: -76.4947 },
  { name: "Colgate University", city: "Hamilton", state: "NY", latitude: 42.8186, longitude: -75.5399 },
  { name: "Vassar College", city: "Poughkeepsie", state: "NY", latitude: 41.6868, longitude: -73.8953 },
  { name: "The New School", city: "New York", state: "NY", latitude: 40.7353, longitude: -73.9974 },
  
  // NORTH CAROLINA
  { name: "Duke University", city: "Durham", state: "NC", latitude: 36.0014, longitude: -78.9382 },
  { name: "UNC Chapel Hill", city: "Chapel Hill", state: "NC", latitude: 35.9049, longitude: -79.0469 },
  { name: "NC State University", city: "Raleigh", state: "NC", latitude: 35.7847, longitude: -78.6821 },
  { name: "Wake Forest University", city: "Winston-Salem", state: "NC", latitude: 36.1334, longitude: -80.2795 },
  { name: "UNC Charlotte", city: "Charlotte", state: "NC", latitude: 35.3074, longitude: -80.7335 },
  { name: "East Carolina University", city: "Greenville", state: "NC", latitude: 35.6079, longitude: -77.3665 },
  { name: "Appalachian State University", city: "Boone", state: "NC", latitude: 36.2160, longitude: -81.6848 },
  { name: "UNC Greensboro", city: "Greensboro", state: "NC", latitude: 36.0687, longitude: -79.8102 },
  { name: "UNC Wilmington", city: "Wilmington", state: "NC", latitude: 34.2273, longitude: -77.8719 },
  { name: "Davidson College", city: "Davidson", state: "NC", latitude: 35.5009, longitude: -80.8434 },
  { name: "North Carolina A&T State University", city: "Greensboro", state: "NC", latitude: 36.0721, longitude: -79.7722 },
  { name: "Elon University", city: "Elon", state: "NC", latitude: 36.1035, longitude: -79.5020 },
  
  // NORTH DAKOTA
  { name: "University of North Dakota", city: "Grand Forks", state: "ND", latitude: 47.9214, longitude: -97.0779 },
  { name: "North Dakota State University", city: "Fargo", state: "ND", latitude: 46.8973, longitude: -96.8018 },
  
  // OHIO
  { name: "Ohio State University", city: "Columbus", state: "OH", latitude: 40.0067, longitude: -83.0305 },
  { name: "Case Western Reserve University", city: "Cleveland", state: "OH", latitude: 41.5045, longitude: -81.6089 },
  { name: "University of Cincinnati", city: "Cincinnati", state: "OH", latitude: 39.1329, longitude: -84.5150 },
  { name: "Miami University", city: "Oxford", state: "OH", latitude: 39.5127, longitude: -84.7319 },
  { name: "Ohio University", city: "Athens", state: "OH", latitude: 39.3240, longitude: -82.1013 },
  { name: "Kent State University", city: "Kent", state: "OH", latitude: 41.1489, longitude: -81.3413 },
  { name: "University of Akron", city: "Akron", state: "OH", latitude: 41.0755, longitude: -81.5085 },
  { name: "Bowling Green State University", city: "Bowling Green", state: "OH", latitude: 41.3783, longitude: -83.6302 },
  { name: "University of Toledo", city: "Toledo", state: "OH", latitude: 41.6577, longitude: -83.6154 },
  { name: "Wright State University", city: "Dayton", state: "OH", latitude: 39.7813, longitude: -84.0624 },
  { name: "Cleveland State University", city: "Cleveland", state: "OH", latitude: 41.5017, longitude: -81.6749 },
  { name: "Oberlin College", city: "Oberlin", state: "OH", latitude: 41.2932, longitude: -82.2174 },
  { name: "Denison University", city: "Granville", state: "OH", latitude: 40.0729, longitude: -82.5276 },
  
  // OKLAHOMA
  { name: "University of Oklahoma", city: "Norman", state: "OK", latitude: 35.2058, longitude: -97.4457 },
  { name: "Oklahoma State University", city: "Stillwater", state: "OK", latitude: 36.1256, longitude: -97.0693 },
  { name: "University of Tulsa", city: "Tulsa", state: "OK", latitude: 36.1511, longitude: -95.9469 },
  { name: "University of Central Oklahoma", city: "Edmond", state: "OK", latitude: 35.6559, longitude: -97.4739 },
  
  // OREGON
  { name: "University of Oregon", city: "Eugene", state: "OR", latitude: 44.0448, longitude: -123.0726 },
  { name: "Oregon State University", city: "Corvallis", state: "OR", latitude: 44.5646, longitude: -123.2620 },
  { name: "Portland State University", city: "Portland", state: "OR", latitude: 45.5118, longitude: -122.6847 },
  { name: "University of Portland", city: "Portland", state: "OR", latitude: 45.5720, longitude: -122.7264 },
  { name: "Lewis & Clark College", city: "Portland", state: "OR", latitude: 45.4503, longitude: -122.6714 },
  { name: "Reed College", city: "Portland", state: "OR", latitude: 45.4794, longitude: -122.6324 },
  
  // PENNSYLVANIA
  { name: "University of Pennsylvania", city: "Philadelphia", state: "PA", latitude: 39.9522, longitude: -75.1932 },
  { name: "Penn State University", city: "University Park", state: "PA", latitude: 40.7982, longitude: -77.8599 },
  { name: "Carnegie Mellon University", city: "Pittsburgh", state: "PA", latitude: 40.4433, longitude: -79.9436 },
  { name: "University of Pittsburgh", city: "Pittsburgh", state: "PA", latitude: 40.4444, longitude: -79.9608 },
  { name: "Temple University", city: "Philadelphia", state: "PA", latitude: 39.9812, longitude: -75.1554 },
  { name: "Drexel University", city: "Philadelphia", state: "PA", latitude: 39.9566, longitude: -75.1899 },
  { name: "Villanova University", city: "Villanova", state: "PA", latitude: 40.0381, longitude: -75.3445 },
  { name: "Lehigh University", city: "Bethlehem", state: "PA", latitude: 40.6065, longitude: -75.3782 },
  { name: "Duquesne University", city: "Pittsburgh", state: "PA", latitude: 40.4361, longitude: -79.9903 },
  { name: "Penn State Harrisburg", city: "Middletown", state: "PA", latitude: 40.1973, longitude: -76.7289 },
  { name: "Bucknell University", city: "Lewisburg", state: "PA", latitude: 40.9547, longitude: -76.8828 },
  { name: "Lafayette College", city: "Easton", state: "PA", latitude: 40.6985, longitude: -75.2154 },
  { name: "Haverford College", city: "Haverford", state: "PA", latitude: 40.0111, longitude: -75.3063 },
  { name: "Swarthmore College", city: "Swarthmore", state: "PA", latitude: 39.9023, longitude: -75.3573 },
  { name: "Bryn Mawr College", city: "Bryn Mawr", state: "PA", latitude: 40.0268, longitude: -75.3148 },
  
  // RHODE ISLAND
  { name: "Brown University", city: "Providence", state: "RI", latitude: 41.8268, longitude: -71.4025 },
  { name: "University of Rhode Island", city: "Kingston", state: "RI", latitude: 41.4803, longitude: -71.5253 },
  { name: "Providence College", city: "Providence", state: "RI", latitude: 41.8410, longitude: -71.4359 },
  { name: "Rhode Island School of Design", city: "Providence", state: "RI", latitude: 41.8262, longitude: -71.4099 },
  
  // SOUTH CAROLINA
  { name: "University of South Carolina", city: "Columbia", state: "SC", latitude: 33.9932, longitude: -81.0279 },
  { name: "Clemson University", city: "Clemson", state: "SC", latitude: 34.6766, longitude: -82.8374 },
  { name: "College of Charleston", city: "Charleston", state: "SC", latitude: 32.7835, longitude: -79.9374 },
  { name: "Furman University", city: "Greenville", state: "SC", latitude: 34.9249, longitude: -82.4390 },
  { name: "Coastal Carolina University", city: "Conway", state: "SC", latitude: 33.7942, longitude: -79.0194 },
  
  // SOUTH DAKOTA
  { name: "University of South Dakota", city: "Vermillion", state: "SD", latitude: 42.7876, longitude: -96.9289 },
  { name: "South Dakota State University", city: "Brookings", state: "SD", latitude: 44.3191, longitude: -96.7841 },
  
  // TENNESSEE
  { name: "Vanderbilt University", city: "Nashville", state: "TN", latitude: 36.1447, longitude: -86.8027 },
  { name: "University of Tennessee", city: "Knoxville", state: "TN", latitude: 35.9544, longitude: -83.9295 },
  { name: "University of Memphis", city: "Memphis", state: "TN", latitude: 35.1187, longitude: -89.9378 },
  { name: "Middle Tennessee State University", city: "Murfreesboro", state: "TN", latitude: 35.8489, longitude: -86.3627 },
  { name: "Tennessee State University", city: "Nashville", state: "TN", latitude: 36.1683, longitude: -86.8313 },
  { name: "East Tennessee State University", city: "Johnson City", state: "TN", latitude: 36.3029, longitude: -82.3695 },
  { name: "Belmont University", city: "Nashville", state: "TN", latitude: 36.1334, longitude: -86.7916 },
  { name: "Rhodes College", city: "Memphis", state: "TN", latitude: 35.1534, longitude: -89.9887 },
  
  // TEXAS
  { name: "University of Texas at Austin", city: "Austin", state: "TX", latitude: 30.2849, longitude: -97.7341 },
  { name: "Texas A&M University", city: "College Station", state: "TX", latitude: 30.6187, longitude: -96.3365 },
  { name: "Rice University", city: "Houston", state: "TX", latitude: 29.7174, longitude: -95.4018 },
  { name: "University of Houston", city: "Houston", state: "TX", latitude: 29.7199, longitude: -95.3422 },
  { name: "UT Dallas", city: "Richardson", state: "TX", latitude: 32.9857, longitude: -96.7502 },
  { name: "Texas Tech University", city: "Lubbock", state: "TX", latitude: 33.5843, longitude: -101.8783 },
  { name: "UT San Antonio", city: "San Antonio", state: "TX", latitude: 29.5826, longitude: -98.6199 },
  { name: "UT Arlington", city: "Arlington", state: "TX", latitude: 32.7299, longitude: -97.1132 },
  { name: "Baylor University", city: "Waco", state: "TX", latitude: 31.5460, longitude: -97.1186 },
  { name: "SMU", city: "Dallas", state: "TX", latitude: 32.8418, longitude: -96.7851 },
  { name: "TCU", city: "Fort Worth", state: "TX", latitude: 32.7098, longitude: -97.3628 },
  { name: "Texas State University", city: "San Marcos", state: "TX", latitude: 29.8884, longitude: -97.9384 },
  { name: "University of North Texas", city: "Denton", state: "TX", latitude: 33.2109, longitude: -97.1470 },
  { name: "UT El Paso", city: "El Paso", state: "TX", latitude: 31.7713, longitude: -106.5040 },
  { name: "UT Rio Grande Valley", city: "Edinburg", state: "TX", latitude: 26.3077, longitude: -98.1737 },
  { name: "Sam Houston State University", city: "Huntsville", state: "TX", latitude: 30.7163, longitude: -95.5472 },
  { name: "Prairie View A&M University", city: "Prairie View", state: "TX", latitude: 30.0952, longitude: -95.9880 },
  { name: "Texas Southern University", city: "Houston", state: "TX", latitude: 29.7237, longitude: -95.3552 },
  
  // UTAH
  { name: "University of Utah", city: "Salt Lake City", state: "UT", latitude: 40.7649, longitude: -111.8421 },
  { name: "Brigham Young University", city: "Provo", state: "UT", latitude: 40.2519, longitude: -111.6493 },
  { name: "Utah State University", city: "Logan", state: "UT", latitude: 41.7420, longitude: -111.8097 },
  { name: "Utah Valley University", city: "Orem", state: "UT", latitude: 40.2769, longitude: -111.7147 },
  { name: "Weber State University", city: "Ogden", state: "UT", latitude: 41.1929, longitude: -111.9344 },
  
  // VERMONT
  { name: "University of Vermont", city: "Burlington", state: "VT", latitude: 44.4779, longitude: -73.1965 },
  { name: "Middlebury College", city: "Middlebury", state: "VT", latitude: 44.0086, longitude: -73.1765 },
  { name: "Bennington College", city: "Bennington", state: "VT", latitude: 42.9235, longitude: -73.2327 },
  
  // VIRGINIA
  { name: "University of Virginia", city: "Charlottesville", state: "VA", latitude: 38.0336, longitude: -78.5080 },
  { name: "Virginia Tech", city: "Blacksburg", state: "VA", latitude: 37.2296, longitude: -80.4139 },
  { name: "William & Mary", city: "Williamsburg", state: "VA", latitude: 37.2707, longitude: -76.7075 },
  { name: "Virginia Commonwealth University", city: "Richmond", state: "VA", latitude: 37.5499, longitude: -77.4513 },
  { name: "George Mason University", city: "Fairfax", state: "VA", latitude: 38.8316, longitude: -77.3081 },
  { name: "James Madison University", city: "Harrisonburg", state: "VA", latitude: 38.4375, longitude: -78.8714 },
  { name: "Old Dominion University", city: "Norfolk", state: "VA", latitude: 36.8851, longitude: -76.3055 },
  { name: "Virginia State University", city: "Petersburg", state: "VA", latitude: 37.2392, longitude: -77.4222 },
  { name: "Liberty University", city: "Lynchburg", state: "VA", latitude: 37.3524, longitude: -79.1765 },
  { name: "Radford University", city: "Radford", state: "VA", latitude: 37.1362, longitude: -80.5561 },
  { name: "Washington and Lee University", city: "Lexington", state: "VA", latitude: 37.7916, longitude: -79.4439 },
  { name: "University of Richmond", city: "Richmond", state: "VA", latitude: 37.5742, longitude: -77.5400 },
  { name: "Hampton University", city: "Hampton", state: "VA", latitude: 37.0219, longitude: -76.3357 },
  { name: "Norfolk State University", city: "Norfolk", state: "VA", latitude: 36.8474, longitude: -76.2696 },
  
  // WASHINGTON
  { name: "University of Washington", city: "Seattle", state: "WA", latitude: 47.6553, longitude: -122.3035 },
  { name: "Washington State University", city: "Pullman", state: "WA", latitude: 46.7298, longitude: -117.1817 },
  { name: "Seattle University", city: "Seattle", state: "WA", latitude: 47.6103, longitude: -122.3196 },
  { name: "Gonzaga University", city: "Spokane", state: "WA", latitude: 47.6671, longitude: -117.4017 },
  { name: "Western Washington University", city: "Bellingham", state: "WA", latitude: 48.7340, longitude: -122.4866 },
  { name: "Eastern Washington University", city: "Cheney", state: "WA", latitude: 47.4891, longitude: -117.5755 },
  { name: "Central Washington University", city: "Ellensburg", state: "WA", latitude: 46.9965, longitude: -120.5478 },
  { name: "University of Puget Sound", city: "Tacoma", state: "WA", latitude: 47.2636, longitude: -122.4814 },
  { name: "Whitman College", city: "Walla Walla", state: "WA", latitude: 46.0715, longitude: -118.3296 },
  
  // WEST VIRGINIA
  { name: "West Virginia University", city: "Morgantown", state: "WV", latitude: 39.6350, longitude: -79.9545 },
  { name: "Marshall University", city: "Huntington", state: "WV", latitude: 38.4242, longitude: -82.4267 },
  
  // WISCONSIN
  { name: "University of Wisconsin-Madison", city: "Madison", state: "WI", latitude: 43.0766, longitude: -89.4125 },
  { name: "University of Wisconsin-Milwaukee", city: "Milwaukee", state: "WI", latitude: 43.0766, longitude: -87.8813 },
  { name: "Marquette University", city: "Milwaukee", state: "WI", latitude: 43.0389, longitude: -87.9298 },
  { name: "UW-La Crosse", city: "La Crosse", state: "WI", latitude: 43.8128, longitude: -91.2270 },
  { name: "UW-Eau Claire", city: "Eau Claire", state: "WI", latitude: 44.7985, longitude: -91.4963 },
  { name: "UW-Green Bay", city: "Green Bay", state: "WI", latitude: 44.5316, longitude: -87.9212 },
  { name: "UW-Oshkosh", city: "Oshkosh", state: "WI", latitude: 44.0267, longitude: -88.5542 },
  { name: "UW-Whitewater", city: "Whitewater", state: "WI", latitude: 42.8405, longitude: -88.7376 },
  { name: "Lawrence University", city: "Appleton", state: "WI", latitude: 44.2613, longitude: -88.3991 },
  
  // WYOMING
  { name: "University of Wyoming", city: "Laramie", state: "WY", latitude: 41.3149, longitude: -105.5666 },
  
  // DISTRICT OF COLUMBIA
  { name: "Georgetown University", city: "Washington", state: "DC", latitude: 38.9076, longitude: -77.0723 },
  { name: "George Washington University", city: "Washington", state: "DC", latitude: 38.8997, longitude: -77.0486 },
  { name: "American University", city: "Washington", state: "DC", latitude: 38.9365, longitude: -77.0878 },
  { name: "Howard University", city: "Washington", state: "DC", latitude: 38.9225, longitude: -77.0195 },
  { name: "Catholic University of America", city: "Washington", state: "DC", latitude: 38.9339, longitude: -76.9989 },
  { name: "Gallaudet University", city: "Washington", state: "DC", latitude: 38.9082, longitude: -76.9927 },
  
  // PUERTO RICO
  { name: "University of Puerto Rico - Río Piedras", city: "San Juan", state: "PR", latitude: 18.4034, longitude: -66.0489 },
  { name: "University of Puerto Rico - Mayagüez", city: "Mayagüez", state: "PR", latitude: 18.2110, longitude: -67.1414 },
  { name: "Inter American University of Puerto Rico", city: "San Juan", state: "PR", latitude: 18.3950, longitude: -66.0613 },
];
