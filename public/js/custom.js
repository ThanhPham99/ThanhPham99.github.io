/*global $, window, WOW*/

$(function () {
    
    "use strict";
    
    var win = $(window),
        htmlBody = $("html, body"),
        scrollToTop = $(".scroll-top"),
        navBar = $(".navbar"),
        progressCheck = false,
        factsCheck = false;
        
    
    /*========== Loading  ==========*/
    $(".loading").animate({
        "top": "-100%"
    }, 700, function () {
        $(this).remove();
    });
	
	/*========== Color Switcher  ==========*/
    $(".switch-button").on("click", function() {
        $(this).addClass("hide");
        $(".switched-styles").addClass("show");
    });
    
    $(".switched-styles .hide-button").on("click", function() {
        $(this).parent().removeClass("show");
        $(".switch-button").removeClass("hide");
    });
    
    $(".switched-styles ul li").on("click", function() {
        $("link[href*='color']").attr("href", "css/colors/" + $(this).data('color') + "_color.css");
    });
    
    /*========== Navbar Animation On Scroll  ==========*/
    function activeNavbar() {
        
        if (win.scrollTop() > 20) {
            navBar.addClass("active-nav");
        } else {
            navBar.removeClass("active-nav");
        }
        
    }
    
    activeNavbar();
    
    win.on("scroll", function () {
        activeNavbar();
    });
    
    /*========== Mobile Menu  ==========*/
    $(".navbar .menu-toggle").on("click", function () {
        navBar.toggleClass("menu-active");
    });
    
    /*========== Smooth Scroll  ==========*/
    $(".navbar .navbar-nav > li:not('.nav-brand') > a").on("click", function (e) {
        e.preventDefault();
        htmlBody.animate({
            scrollTop: $($(this).data('value')).offset().top
        }, 600);
    });
    
    /*========== Add Class Active to Menu Links on Scrolling  ==========*/
    win.on("scroll", function () {
        $("section").each(function () {
            if (win.scrollTop() >= $(this).offset().top - 1) {
                $(".navbar .navbar-nav > li > a[data-value='#" + $(this).attr("id") + "']").addClass("active").parent().siblings().find("a").removeClass("active");
            }
        });
    });
    
    /*========== Skills Progress  ==========*/
    $(".progress-container").each(function () {
        var timer = $(this).find(".percent");
        timer.css("left", "calc(" + timer.data("to") + "% - 15px)");
    });
    function skillsPogress() {
        $(".progress-container").each(function () {
            var timer = $(this).find(".percent"),
                progressBar = $(this).find(".progress-bar");
            timer.countTo();
            progressBar.css("width", progressBar.attr("aria-valuenow") + "%");
        });
    }
    
    if (!progressCheck && $(this).scrollTop() >= $(".skills").offset().top - 300) {
        skillsPogress();
        progressCheck = true;
    }
    
    win.on("scroll", function () {
        
        if (!progressCheck && $(this).scrollTop() >= $(".skills").offset().top - 300) {
            skillsPogress();
            progressCheck = true;
        }
        
    });
	
	/*========== Skills Progress  ==========*/
    $(".rtl-demo .progress-container").each(function () {
        var timer = $(this).find(".percent");
        timer.css("right", "calc(" + timer.data("to") + "% - 15px)");
    });
    
    /*========== Start Portfolio Trigger Filterizr Js  ==========*/
    $("#control li").on('click', function () {
        $(this).addClass('active').siblings("li").removeClass('active');
    });
    // The Filterizr
    $('#filtr-container').filterizr({
        animationDuration: 0.4
    });
    
    /*========== Start Magnigic Popup Js ==========*/
    if ($('.portfolio-content .item')[0]) {

        $('.portfolio-content .item').magnificPopup({
            delegate: 'a',
            type: 'image',
            gallery: {
                enabled: true
            }
        });
    }
    
    /*========== Facts Counter  ==========*/
    // if (!factsCheck && $(this).scrollTop() >= $(".facts").offset().top - 400) {
    //     $(".facts .fact-number").countTo();
    //     factsCheck = true;
    // }
    
    // win.on("scroll", function () {
    //     if (!factsCheck && $(this).scrollTop() >= $(".facts").offset().top - 400) {
    //         $(".facts .fact-number").countTo();
    //         factsCheck = true;
    //     }
    // });
    
    /*========== Owl Carousel Js Testimonial  ==========*/
    $(".testimonials .owl-carousel").owlCarousel({
        items: 2, 
        autoplay: true,
        smartSpeed: 500,
        margin: 30,
        loop: true,
        autoplayHoverPause: true,
        responsiveClass: true,
		responsive: {
            0: {
                items: 1
            },
            991: {
                items: 2
            }
        }
    });
    
    /*========== Scroll To Top  ==========*/
    function scrollUp() {
        if (win.scrollTop() >= 1200) {
            scrollToTop.addClass("active");
        } else {
            scrollToTop.removeClass("active");
        }
    }
    
    scrollUp();
    
    win.on("scroll", function () {
        scrollUp();
    });
    
    scrollToTop.on("click", function (e) {
        e.preventDefault();
        htmlBody.animate({
            scrollTop: 0
        }, 800);
    });
    
    /*========== Fire wow js Plugin  ==========*/
    new WOW().init();
    
});