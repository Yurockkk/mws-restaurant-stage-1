let restaurant, reviews, form, fav, isFav = false;
var map;


/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      isFav = restaurant.is_favorite;
      fav.src = isFav ? `img/solidFav.svg` : `img/fav.svg`;
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  fav = document.getElementById('fav-icon');
  fav.addEventListener('click', onFavClick);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = DBHelper.imageSourceSetForRestaureant(restaurant);
  image.alt = `picture of the restaurant ${restaurant.name}`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fetchRestaurantReviews(restaurant.id);
  
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  //add a form to the page
  let form = CreateFormHTML();
  form.addEventListener('submit', onSubmit);
  //if(!form) {
    container.appendChild(form);
  //}

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.createdAt;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

onSubmit = (e) => {
  e.preventDefault();
  console.log('in onSendClick!');
  console.log(form.elements[0].value);
  console.log(form.elements[1].value);
  console.log(form.elements[2].value);
  const reviewToAdd = {
    restaurant_id: parseInt(getParameterByName('id'),10),
    name: form.elements[0].value,
    rating: form.elements[1].value,
    comments: form.elements[2].value,
    createdAt: Date.now()
  };


  fetch("http://localhost:1337/reviews/",{
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(reviewToAdd)
  }).then((response) => {
    console.log(response);
    if(response.ok) return response.json();
  }).then((addedReview) => {
    console.log(addedReview);
    displayNewReview(addedReview);
  }).catch((error) => {
    //fail to add the review to the BE, do something here
    console.log(error);
    if(!navigator.onLine){
      //TODO: store the review to the idb
      DBHelper.saveReviewToIdb(reviewToAdd);
    }
    displayNewReview(reviewToAdd);
  });

  form.reset();
}

displayNewReview = (newReview) => {
  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML({
    "id": newReview.id,
    "restaurant_id": newReview.restaurant_id,
    "name": newReview.name,
    "createdAt": newReview.createdAt || Date.now(),
    "updatedAt": newReview.updateAt,
    "rating": newReview.rating,
    "comments": newReview.comments
  }));
}

fetchRestaurantReviews = (id) => {
  DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
    self.reviews = reviews;
    if(!self.reviews){
      console.log('something went wrong while fetching the reviews')
      return;
    }
    fillReviewsHTML();
  });
}

CreateFormHTML = () => {

  form = document.createElement('form');
  form.id = 'new-review';
  //form.method = 'post';
  //form.action = `http://localhost:1337/reviews/`;

  //add form input to the form
  let nameLabel = document.createElement('label');
  nameLabel.innerHTML = "your name: ";
  nameLabel.htmlFor = "username";
  nameLabel.form = "new-review";
  form.appendChild(nameLabel);

  let name = document.createElement('input');
  name.type = "text";
  name.id = "username";
  name.name = "username";
  name.form = "new-review";
  form.appendChild(name);
  form.appendChild(document.createElement('br'));
  form.appendChild(document.createElement('br'));

  let ratingLabel = document.createElement('label');
  ratingLabel.innerHTML = "your rating: ";
  ratingLabel.htmlFor = "user-rating";
  ratingLabel.form = "new-review";
  form.appendChild(ratingLabel);

  let rating = document.createElement('select');
  rating.id = "user-rating";
  rating.name = "user-rating";
  for(let i = 0; i < 5; i++){
    var option = document.createElement('option');
    option.value = `${i+1}`;
    option.innerHTML = `${i+1} star(s)`;
    rating.appendChild(option);
  }
  rating.form = "new-review";
  form.appendChild(rating);
  form.appendChild(document.createElement('br'));
  form.appendChild(document.createElement('br'));

  let commentsLabel = document.createElement('label');
  commentsLabel.innerHTML = "your comments: ";
  commentsLabel.htmlFor = "user-comments";
  commentsLabel.form = "new-review";
  form.appendChild(commentsLabel);

  let comments = document.createElement('textarea');
  comments.id = "user-comments";
  comments.name = "user-comments";
  comments.form = "new-review";
  form.appendChild(comments);
  form.appendChild(document.createElement('br'));
  form.appendChild(document.createElement('br'));

  let submitBtn = document.createElement('input');
  submitBtn.type = "submit";
  submitBtn.id = "submit-btn";
  submitBtn.value = "Submit";
  form.appendChild(submitBtn);
  form.appendChild(document.createElement('br'));
  form.appendChild(document.createElement('br'));

  return form;
}

onFavClick = () => {
  console.log('in onFavClick');
  console.log(fav);
  isFav = !isFav;
  fav.src = isFav ? `img/solidFav.svg` : `img/fav.svg`;
  fetch(`http://localhost:1337/restaurants/${self.restaurant.id}/?is_favorite=${isFav}`,{
    method: "PUT" // *GET, POST, PUT, DELETE, etc.
  }).then(response => {
    console.log(response);
    if(response.ok) return response.json();
  }).then(updatedRestaurant => {
    console.log(updatedRestaurant);
    DBHelper.updateCachedRestaurant(updatedRestaurant);
  }).catch(err => {
    console.log(err);
  })
}
