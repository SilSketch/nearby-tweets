/**
 * Service for exchanging information with Twitter API 1.1
 * Name: twitterService
 */
var servicesModule = angular.module('nearbyTweetsApp.services', [])
    .factory('twitterService', function($q, messageService) {

        /*-----------------------------------------------
        * CONTROLLER ATTRIBUTES
        *-----------------------------------------------
        */ 
        var OAUTH_KEY = '';
        var URL_SERV_SEARCH_TWEETS = 'search/tweets.json';
        var URL_SERV_GET_oEMBED_FORMAT = 'statuses/oembed.json';
        var URL_API = '/1.1/';
        var URL_SERV_POST_STATUS = 'statuses/update.json';
        var URL_SERV_GET_PLACE = 'geo/reverse_geocode.json';
        var authorizedConnection = false;

        /*-----------------------------------------------
         * KEYS OF PARAMETERS FOR QUERIES PER REQUEST TYPE
         * TARGET OBJECTS TO BE CLONED EACH TIME
         *-----------------------------------------------
         */

        var oEmbedTweetMediaKeys = {
            id: '',
            url: 'l',
            maxwidth: '500',
            hide_media: '0',
            hide_thread: '1',
            omit_script: '',
            align: 'center',
            related: '',
            lang: '',
            widget_type: '',
            hide_tweet: ''
        };

        var oEmbedTweetKeys = {
            id: '',
            url: '1',
            hide_media: 'true',
            cards: 'hidden',
            maxwidth: '500',
            hide_thread: 'true',
            omit_script: '',
            align: 'center',
            related: '',
            lang: '',
            widget_type: 'twitter-tweet',
            hide_tweet: 'true'
        };

        var oEmbedSingleVideoKeys = {
            id: '',
            url: '',
            maxwidth: '500',
            hide_media: '',
            hide_thread: 'true',
            omit_script: '',
            align: 'center',
            related: '',
            lang: 'en',
            widget_type: 'video',
            hide_tweet: 'true'
        };

        var oldTweetsKeys = {
            q: '',
            geocode: '',
            lang: '',
            locale: '',
            result_type: '',
            count: '',
            until: '',
            max_id: '',
            include_entities: ''
        };

        var newTweetKeys = {
            q: '',
            geocode: '',
            lang: '',
            locale: '',
            result_type: '',
            count: '',
            until: '',
            since_id: '',
            include_entities: ''
        };

        var newUserTweetsKeys = {
            user_id: '',
            scren_name: '',
            since_id: '',
            count: '',
            trim_user: '',
            exclude_replies: '',
            contributor_details: '',
            include_rts: ''
        };

        var oldUserTweetsKeys = {
            user_id: '',
            scren_name: '',
            max_id: '',
            count: '',
            trim_user: '',
            exclude_replies: '',
            contributor_details: '',
            include_rts: ''
        };

        var placeKeys = {
            lat: '',
            long: '',
            accuracy: '',
            granularity: '',
            max_results: ''
        };
        
        var statusPostParameters = {
            status: '',        
            lat: '',
            long: '',
            place_id: '',
            display_coordinates: ''
        };
        /*-----------------------------------------------
         * COMMON FUNCTIONS
         *-----------------------------------------------
         */

        /**
         * * Local service that clones the targetObjectToClone with the keys and sets the corresponding values at sourceObject
         * @param {JSON} sourceObject Object with the values to set in the cloned object. It may have empty, and other keys.
         * @param {JSON} targetObjectToClone Object with the keys to find in the source object that is cloned
         * @returns New instance of an object with the available source values for the target keys
         */
        setParameters = function(sourceObject, targetObjectToClone) {
                var clonedTarget = JSON.parse(JSON.stringify(targetObjectToClone));
                for (var prop in targetObjectToClone) {
                    if (sourceObject.hasOwnProperty(prop)) {
                        if (sourceObject[prop])
                            clonedTarget[prop] = sourceObject[prop];
                    }

                }
                return clonedTarget;
            },

            /**
             * Local service that builds the parameters of a request
             * @post: The # is double encoded as required by the Twitter API 1.1.
             * @param {JSON} params The keys and values of the parameters
             * @returns {String} requestURL The parameters formatted as an URL
             */
            buildRequestParametersURL = function(params) {
                var requestURL = '';
                var withValues = false;
                angular.forEach(params, function(value, key) {
                    if (value && value !== '') {
                        if (!withValues) {
                            requestURL += '?';
                            withValues = true;
                        } else
                            requestURL += '&';
                        requestURL = requestURL + key + '=' + value;
                    }
                });
                requestURL = requestURL.replace("#", "%23");
                return requestURL;
            },

            /**
             * Utilitarian async service that makes an GET request to the Twitter API
             * @post: The authorization token is automatically included in the request
             * @param {type} requestURL The request including the service called with the parameters
             * @returns {$q@call;defer.promise} The response data of the request to the API when the promise is resolved
             */
            makeGETRequestQuery = function(requestURL) {
                console.log("Request: " + requestURL);
                var deferred = $q.defer();
                try {
                    authorizedConnection.get(requestURL)
                        .done(function(data) {
                            deferred.resolve(data);
                        }).fail(function(err) {
                            deferred.reject(err);
                        });
                    return deferred.promise;
                } catch (error) {
                    console.log("Connection lost");
                }
            };

        return {

            /**
             * SESSION CONNECTION FUNCTIONS
             */

            /**
             * Initializes OAuth connection with the public key OAuth given for the Twitter Application
             * @returns {undefined}
             */
            initialize: function() {
                if(OAUTH_KEY !== '')
                {
                    OAuth.initialize(OAUTH_KEY, {
                        cache: true
                    });
                    authorizedConnection = OAuth.create('twitter');
                }
                else
                    messageService.setMessage(messageService.ERR_CHECK_AUTHORIZATION_CREDENTIALS, 'error');
            },

            /**
             * Indicates when the connection to twitter isn't available or the authorized connection
             * @returns {result|Boolean}
             */
            isReady: function() {
                return authorizedConnection;
            },

            /**
             * Creates a connection for the user connected at the propt window
             * @returns {$q@call;defer.promise} The response data of the request to the API when the promise is resolved
             */
            connectTwitter: function() {
                var deferred = $q.defer();
                OAuth.popup('twitter', {
                    cache: true
                }, function(error, result) { //cache means to execute the callback if the tokens are already present
                    if (!error) {
                        authorizedConnection = result;
                        deferred.resolve();
                    } else {
                        deferred.reject();
                    }
                });
                return deferred.promise;
            },

            /**
             * Closes the connection by clearing the cache         
             */
            clearCache: function() {
                OAuth.clearCache('twitter');
                authorizedConnection = false;
            },



            /*-----------------------------------------------
             * SPECIFIC REQUESTS FUNCTIONS
             *-----------------------------------------------
             */
            
            setStatusPostParameters: function (parameters){
                var keysAndValues = setParameters (parameters, statusPostParameters);
                statusPostParameters = keysAndValues;
            },
            
            /**
             * Async service that requests the location of the visitor with the given coordinates
             * @post: Response of the request by the HTTP Method: GET 
             * @param {type} parameters The values of the parameteres to use
             * @returns {$q@call;defer.promise} The response data of the request to the API when the promise is resolved
             */
            searchPlaceIDByParams: function(parameters) {
                var serviceURL = URL_SERV_GET_PLACE;
                var requestURL = URL_API + serviceURL;
                var params = setParameters(parameters, placeKeys);
                var paramsURL = buildRequestParametersURL(params);
                if (paramsURL !== '') {
                    requestURL += paramsURL;
                    return makeGETRequestQuery(requestURL);
                }
            },

            /**
             * Async service that requests a list of tweets with the given query 
             * @param {type} formattedParamsQuery The query that has the values of the parameters
             * @returns {$q@call;defer.promise} The response data of the request to the API when the promise is resolved
             */
            searchTweetsByQuery: function(formattedParamsQuery) {
                var serviceURL = URL_SERV_SEARCH_TWEETS;
                var requestURL = URL_API + serviceURL + formattedParamsQuery;
                return makeGETRequestQuery(requestURL);
            },

            /**
             * Async service that requests a list of tweets with the given parameters, determines the set of keys to use based on the newTweets flag
             * @post: Response of the request by the HTTP Method: GET 
             * @param {JSON} parameters Values to use for the parameters
             * @param {boolean} filterParams Flag to indicate if the parameters need to be filtered with the requiered by the API (true|false)
             * @param {boolean} newTweets Flag to indicate if the request is of new or old tweets
             * @returns {$q@call;defer.promise} The response data of the request to the API when the promise is resolved
             */
            searchTweetsByParams: function(parameters, filterParams, newTweets) {
                var serviceURL = URL_SERV_SEARCH_TWEETS;
                var requestURL = URL_API + serviceURL;
                var params = [];

                if (filterParams) {
                    params = setParameters(parameters, newTweets ? newTweetKeys : oldTweetsKeys);
                } else {
                    params = parameters;
                }
                var paramsURL = buildRequestParametersURL(params);
                if (paramsURL !== '') {
                    requestURL += paramsURL;
                    return makeGETRequestQuery(requestURL);
                }
            },

            /**
             * Async service that requests the HTML snippet of the tweeter widget of a tweet with the given id
             * @post: Response of the request by the HTTP Method: GET 
             * @param {type} tweetID The id of the tweet to request (required)
             * @param {type} url The url (optional)
             * @param {type} lang The language
             * @param {type} widget_type The type of the widget        
             * @returns {$q@call;defer.promise} The response data of the request to the API when the promise is resolved
             */
            searchTweetHTMLSnippetAsync: function(tweetID, url, lang, widget_type) {
                var requestURL = URL_API + URL_SERV_GET_oEMBED_FORMAT;
                var params = JSON.parse(JSON.stringify(oEmbedTweetKeys));
                params.id = tweetID;
                if (url)
                    params.url = url;
                if (lang)
                    params.lang = lang;
                if (widget_type === 'video') {
                    params.widget_type = widget_type;
                    params.hide_tweet = 1;
                }
                var paramsURL = buildRequestParametersURL(params);
                if (paramsURL !== '') {
                    requestURL += paramsURL;
                    return makeGETRequestQuery(requestURL);
                }
            },

            /**
             * Async service that sends a post to twitter for the logged used
             * @post: The status is posted in the logged used timeline with the HTTP Method: POST 
             * @param {String} hashTag doesn't includes the prefix symbol
             * @param {String} videolink The video link to post as part of the comment
             * @param {String} comment The comment to post         
             * @returns {$q@call;defer.promise} The response data of the request to the API when the promise is resolved
             */
            postStatusTweet: function(hashTag, videolink, comment) {
                var url = URL_API + URL_SERV_POST_STATUS + '?status=';
                url += '%23' + hashTag + ' ';
                url += videolink + ' ';
                url += comment;
                url += '&lat='+statusPostParameters.lat;
                url += '&long='+statusPostParameters.long;
                url+= '&place_id='+statusPostParameters.place_id;

                var deferred = $q.defer();
                try {
                    authorizedConnection.post(url).done(function(data) {
                        deferred.resolve(data);
                    }).fail(function(err) {
                        deferred.reject(err);
                    });
                } catch (error) {
                    deferred.reject(error);
                } finally {
                    return deferred.promise;
                }

            }
        };
    });