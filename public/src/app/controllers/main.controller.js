/**
 * Main Controller
 * Name: TwitterController
 */
app.controller('TwitterController', function($scope, $q, $sce, $log, $interval, $timeout, twitterService, messageService) {

    /*-----------------------------------------------
     * CONTROLLER ATTRIBUTES
     *-----------------------------------------------
     */
    var mc = this;
    mc.emdedData = false;
    mc.feedbackMessage = '';
    mc.twitterReqParameters = {
        hashTag: 'nowplaying',
        content: 'youtube',
        //GET search/tweets
        q: '',
        lang: '',
        locale: '',
        result_type: 'recent',
        count: '5',
        until: '',
        since_id: '',
        max_id: '',
        include_entities: '',

        //GET statuses/oembed
        id: '',
        url: '',
        maxwidth: '500',
        hide_media: '0',
        hide_thread: '1',
        omit_script: '',
        align: 'center',
        related: '',
        //lang:'',
        widget_type: '',
        hide_tweet: '',

        //POST statuses/update
        status: '',        
        lat: '',
        long: '',
        place_id: '',

        //PLACE
        granularity: 'city'
    };


    /*-----------------------------------------------
     * INITIALIZATION AND SESSION FUNCTIONS
     *-----------------------------------------------
     */


    /**
     * Initiazliation
     */
    mc.initialize = function() {
        //Colombia "0161be1b3f98d6c3",
        //San Francisco: "5a110d312052166f"
        
        mc.stopRefreshInterval();
        mc.twitterConnected = false;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                mc.twitterReqParameters.lat = position.coords.latitude;
                mc.twitterReqParameters.long = position.coords.longitude;
            });
        }
        mc.appData = {
            refresh_url: '',
            next_results: '',
            minutesToRefresh: 1
        };
        mc.tweets = [];
        mc.twitterReqParameters.q = '#' + mc.twitterReqParameters.hashTag + ' ' + mc.twitterReqParameters.content + ' filter:videos';
        //min_replies:3 min_retweets:1 min_faves:2
        //exclude:retweets 'place:0161be1b3f98d6c3' 

        mc.twitterConnected = false;
        mc.twitterReqParameters.since_id;
        mc.twitterReqParameters.max_id;

        //SCOPE INFORMATION
        mc.appData.visitorLocated = false;
        $scope.appHashTag = mc.twitterReqParameters.hashTag;             
    };

    mc.twitterLogIn = function() {
        console.log("Sing In Pressed"); 
        twitterService.initialize();         
        twitterService.connectTwitter().then(function() {
             if (twitterService.isReady()) {
                 if (mc.twitterReqParameters.lat !== '')
                {   
                    var locWait = twitterService.searchPlaceIDByParams(mc.twitterReqParameters);
                    locWait.then(function successCallback(response) {
                    mc.appData.visitorLocated = true;
                    mc.twitterReqParameters.place_id = response.result.places[0].id;
                    mc.appData.visitorCity = response.result.places[0].name;
                    mc.appData.visitorCountry = response.result.places[0].country;
                    mc.appData.visitorFullPlace = response.result.places[0].full_name;
                    mc.twitterReqParameters.q = 'place:' + mc.twitterReqParameters.place_id + ' ' + mc.twitterReqParameters.q;
                    twitterService.setStatusPostParameters (mc.twitterReqParameters);
                    mc.searchLatestTweetsByHashTag();
                    mc.startRefreshInterval();
                    mc.twitterConnected = true;                
                    }, function errorCallBack(error) {
                        return mc.twitterResponseError(error, ERR_CHECK_CONNECTION_CREDENTIALS);
                    }, function notificationCallBack(notification) {

                    });
                }
                else 
                {
                    mc.searchLatestTweetsByHashTag();
                    mc.startRefreshInterval();
                    mc.twitterConnected = true; 
                    console.log("Geolocation is not enabled in the browser. Nearby tweets is disabled.");
                }            
        }}, function errorCallBack(error) {            
            messageService.setMessage(messageService.ERR_CHECK_CONNECTION_CREDENTIALS, 'error');
        }, function notificationCallBack(notification) {

        }).catch(function(error) {
            messageService.setMessage(messageService.ERR_CHECK_CONNECTION_CREDENTIALS, 'error');
        });
        
    };

    /**
     * Close the twitter session, clears the cache and initializes the application
     */
    mc.twitterLogOut = function() {
        mc.stopRefreshInterval();
        twitterService.clearCache();        
        mc.initialize();
    };

    /*-----------------------------------------------
     * SEARCH FUNCTIONS
     *-----------------------------------------------
     */

    /**
     * Starts an interval to search periodically the most recent tweets
     * @pre: The variable mc.appData.minutesToRefresh must be defined. Represents the frequency of refresh.
     */
    mc.startRefreshInterval = function() {        
        $scope.Timer = $interval(function() {
            mc.searchLatestTweetsByHashTag();
        }, 60000 * mc.appData.minutesToRefresh);
        setInterval(function() {
            twttr.widgets.load();
           // console.log("repainting twitter widgets");
        }, 1000);
    };

    /**
     * Stops the interval to search periodically the latest tweets
     */
    mc.stopRefreshInterval = function() {
        if (angular.isDefined($scope.Timer)) {
            $interval.cancel($scope.Timer);
        }
    };

    /**
     * Updates mc.twitterReqParameters.since_id and mc.twitterReqParameters.max_id to be used for requests
     */
    mc.updateBoardIDs = function() {
        if (mc.tweets) {
            mc.updateSinceID(mc.tweets[0]);
            mc.updateMaxID(mc.tweets[(mc.tweets.length) - 1]);
            console.log("since_id: (" + mc.twitterReqParameters.since_id + ") max_id (" + mc.twitterReqParameters.max_id + ")");
        }
    };

    /**
     * Sets the mc.twitterReqParameters.since_id to be used on requests of new tweets
     * @param {String} tweetSinceID The ID to be set     
     */
    mc.updateSinceID = function(tweetSinceID) {
        if (tweetSinceID) {
            mc.twitterReqParameters.since_id = tweetSinceID.id_str;
        }
    };

    /**
     * Sets the mc.twitterReqParameters.max_id to be used on requests of older tweets
     * @param {String} tweetUntilMaxID The ID to be set     
     */
    mc.updateMaxID = function(tweetUntilMaxID) {
        if (tweetUntilMaxID) {
            mc.twitterReqParameters.max_id = tweetUntilMaxID.id_str;
        }
    };

    /**
     * Adds the tweets in the response at the beginning if they are new or at the end if they are old and updates the pre-built queries
     * @param {JSON} response The response with the statuses containing the tweets to add
     * @param {Boolean} newTweets Flag that indicates if the tweets are new (true) or old (false)
     * @returns {Boolean} True if done
     */
    mc.addRetrievedTweets = function(response, newTweets) {
        var updatedQuery;
        if (response.statuses && response.statuses.length > 0) {
            if (newTweets) {
                mc.tweets = (response.statuses).concat(mc.tweets);
                updatedQuery = response.search_metadata.refresh_url;
                //undefined is accepted because in that case, the next request of this type will be by parameters
                mc.appData.refresh_url = updatedQuery;
            } else {

                var firstOld_id_str = response.statuses[0].id_str;
                if (firstOld_id_str === mc.twitterReqParameters.max_id) {
                    response.statuses.shift();
                }
                mc.tweets = mc.tweets.concat(response.statuses);
                updatedQuery = response.search_metadata.next_results;
                //undefined is accepted because in that case, the next request of this type will be by parameters
                mc.appData.next_results = updatedQuery;

            }
        }
        console.log("next_results: " + mc.appData.next_results);
        console.log("refresh_url: " + mc.appData.refresh_url);
        console.log("added (" + response.statuses.length + ")" + (newTweets ? " new " : " old ") + "Retrieved Tweets -> total:" + mc.tweets.length);        
        return true;
    };

    /**
     * Search the most recent tweets with the current application data and default configuration
     * @post: Updates the array binded to the viewer without repeating tweets
     */
    mc.searchLatestTweetsByHashTag = function() {
        mc.updateBoardIDs();
        if (mc.waitingResponse === true)
            return;
        var refreshQuery;
        try {

            refreshQuery = mc.appData.refresh_url;
        } catch (error) {

        } finally {
            var promise;
            if (refreshQuery) {
                promise = twitterService.searchTweetsByQuery(refreshQuery);
            } else {
                promise = twitterService.searchTweetsByParams(mc.twitterReqParameters, true, true);
            }
            if (promise) {
                mc.waitingResponse = true;

                promise.then(function successCallback(response) {
                    mc.attachSelectedTweetsHTMLSnippets(response.statuses);
                    mc.addRetrievedTweets(response, true);
                    mc.waitingResponse = false;
                }, function errorCallBack(error) {
                    return mc.twitterResponseError(error);
                }, function notificationCallBack(notification) {

                }).catch(function(error) {
                    return mc.twitterResponseError(error);
                });
            }
        }

    };

    /**
     * Search the next older tweets with the current application data and default configuration
     * @post: Updates the array binded to the viewer without repeating tweets
     */
    mc.searchNextOlderTweetsByHashTag = function() {
        mc.updateBoardIDs();
        if (mc.waitingResponse === true)
        {
            console.log("searchNextOlderTweetsByHashTag cancelled");
            return;
        }
        var query = mc.appData.next_results;
        var promise;
        if (query) {
            promise = twitterService.searchTweetsByQuery(query);
        } else {
            promise = twitterService.searchTweetsByParams(mc.twitterReqParameters, true, false);
        }

        if (promise) {
            mc.waitingResponse = true;
            promise.then(function successCallback(response) {
                mc.attachSelectedTweetsHTMLSnippets(response.statuses);
                mc.addRetrievedTweets(response, false);
                mc.waitingResponse = false;
            }, function errorCallBack(error) {
                return mc.twitterResponseError(error);
            }, function notificationCallBack(notification) {

            }).catch(function(error) {
                return mc.twitterResponseError(error);
            });
        }
    };

    /**
     * Search the HTML sinippets of the widget of each tweet in the given array and bind it to the tweet
     * @pre: The tweetsArray is defined
     * @post: Updates each tweet adding to it the OEMBED given by the api
     * @param {type} tweetsArray The array for which the OEMBED will be searched
     */
    mc.attachSelectedTweetsHTMLSnippets = function(tweetsArray) {
        tweetsArray.reduce(function(promise, aTweet) {
            return promise.then(function() {
                twitterService.searchTweetHTMLSnippetAsync(aTweet.id_str)
                    .then(function(data) {
                        aTweet.emdeddedHTML = data;
                    }).catch(function(error) {
                        console.log("Error getting snippet of :" + aTweet.id_str);
                    });
            });

        }, $q.when());
        mc.emdedData = true;
    };

    /**
     * Logs and error and sets feedback message
     * @pre: Default message to be used: messageService.ERR_CHECK_CONNECTION_CREDENTIALS
     * @param {type} errorResponse Response with the error to be logged
     * @param {type} feedbackMSG Customized error feedback message (optional)     
     */
    mc.twitterResponseError = function(errorResponse, feedbackMSG) {
        $log.error('Twitter Request Failed');
        $log.error(errorResponse);
        if (feedbackMSG)
            messageService.setMessage(feedbackMSG, 'error');
        else
            messageService.setMessage(messageService.ERR_CHECK_CONNECTION_CREDENTIALS, 'error');
    };

    /*-----------------------------------------------
     * EVENT HANDLER FUNCTIONS
     *-----------------------------------------------
     */
    $scope.$on('handleSuccessFeedback', function() {
        mc.feedbackMessage = messageService.message;
        mc.showErrorFeedback = false;
        mc.showWarningFeedback = false;
        mc.showSuccessFeedback = true;
    });
    $scope.$on('handleWarningFeedback', function() {
        mc.feedbackMessage = messageService.message;
        mc.showErrorFeedback = false;
        mc.showWarningFeedback = true;
        mc.showSuccessFeedback = false;
    });
    $scope.$on('handleErrorFeedback', function() {
        mc.feedbackMessage = messageService.message;
        mc.showErrorFeedback = true;
        mc.showWarningFeedback = false;
        mc.showSuccessFeedback = false;
    });

    $scope.$on('refreshLatestTweets', function() {
        mc.searchLatestTweetsByHashTag();
    });

    $scope.$on('handleFeedbackTimer', function() {
        $timeout(function() {
            mc.showErrorFeedback = false;
            mc.showWarningFeedback = false;
            mc.showSuccessFeedback = false;
            messageService.resetMessage();
        }, 5000);
    });


});