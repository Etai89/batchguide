$(function(){
  const $doc=$(document)
  const $sidebar=$('#sidebar')
  const $menuToggle=$('#menu-toggle')
  const $search=$('#search')
  const $showSolutions=$('#show-solutions')
  const $solutions=$('#solutions')
  const THEME_KEY='bt_theme'
  
  // Mobile navigation
  $menuToggle.off('click').on('click', function(e){
    e.preventDefault()
    $sidebar.toggleClass('open')
    $('.sidebar-overlay').toggleClass('active')
    $('body').toggleClass('sidebar-open')
  })
  
  // Close sidebar when clicking overlay
  $('.sidebar-overlay').off('click').on('click', function(){
    $sidebar.removeClass('open')
    $('.sidebar-overlay').removeClass('active')
    $('body').removeClass('sidebar-open')
  })

  // init theme
  function applyTheme(theme){
    if(theme==='dark'){document.documentElement.setAttribute('data-theme','dark');$('#theme-toggle').attr('aria-pressed','true')} else {document.documentElement.removeAttribute('data-theme');$('#theme-toggle').attr('aria-pressed','false')}
  }
  let saved=localStorage.getItem(THEME_KEY)||'light'
  applyTheme(saved)

  $('#theme-toggle').on('click',function(){
    saved = saved==='dark'?'light':'dark'
    localStorage.setItem(THEME_KEY,saved)
    applyTheme(saved)
  })

  // smooth scroll to anchors and active state
  $('a[href^="#"]').on('click',function(e){
    const href=$(this).attr('href')
    if(href && href.startsWith('#')){
      e.preventDefault()
      const $t=$(href)
      if($t.length){
        // Remove active class from all links
        $('.toc a').removeClass('active')
        // Add active class to clicked link
        $(this).addClass('active')
        $('html,body').animate({scrollTop:$t.offset().top-80},350)
      }
    }
  })

  // highlight active section on scroll
  const sections=$('.section')
  $(window).on('scroll',function(){
    let scrollTop=$(window).scrollTop()
    let currentSection=''
    sections.each(function(){
      const $s=$(this)
      if($s.offset().top-150 <= scrollTop){
        currentSection=$s.attr('id')
      }
    })
    if(currentSection){
      $('.toc a').removeClass('active')
      $(`.toc a[href="#${currentSection}"]`).addClass('active')
      history.replaceState(null,'', '#'+currentSection)
    }
  })

  // copy buttons
  $('.copy-btn').each(function(){
    const $btn=$(this)
    $btn.on('click',function(){
      const code=$btn.siblings('pre').text()
      if(navigator.clipboard){
        navigator.clipboard.writeText(code).then(()=>{
          $btn.text('הועתק')
          setTimeout(()=>$btn.text('העתק'),1500)
        })
      } else {
        const ta=document.createElement('textarea')
        ta.value=code
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        $btn.text('הועתק')
        setTimeout(()=>$btn.text('העתק'),1500)
      }
    })
  })

  // show/hide solutions
  $showSolutions.on('click',function(){
    const isHidden=$solutions.attr('hidden')
    if(isHidden){
      $solutions.removeAttr('hidden')
      $showSolutions.text('הסתר פתרונות')
    } else {
      $solutions.attr('hidden','')
      $showSolutions.text('הצג פתרונות')
    }
  })

  

  // ensure directionality for code blocks
  $('pre code').attr('dir','ltr')

  // Advanced search and filtering system with navigation
  let searchResults = []
  let currentResultIndex = 0

  function clearMarks(){
    $('.section').each(function(){
      const $s=$(this)
      $s.show() // Show all sections
      $s.removeClass('current-result')
      $s.find('mark').each(function(){
        const $m=$(this)
        $m.replaceWith($m.text())
      })
    })
    searchResults = []
    currentResultIndex = 0
    $('.search-navigation').hide()
    deactivateMobileNavigation()
  }

  function searchAndFilter(term){
    if(!term) {
      $('.section').show()
      searchResults = []
      $('.search-navigation').hide()
      return
    }

    const searchTerms = term.toLowerCase().split(' ').filter(t => t.length > 0)
    let foundMarks = []

    $('.section').each(function(){
      const $section = $(this)
      const sectionText = $section.text().toLowerCase()
      let hasMatches = false
      
      // Check if section contains ANY search term
      const matchesAnyTerm = searchTerms.some(searchTerm => 
        sectionText.includes(searchTerm)
      )

      if(matchesAnyTerm) {
        $section.show()
        hasMatches = true
        
        // Highlight matches and collect mark positions
        searchTerms.forEach(searchTerm => {
          const re = new RegExp('('+searchTerm.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig')
          
          // Highlight in text nodes
          $section.find('*').addBack().contents().filter(function(){
            return this.nodeType === 3 && this.nodeValue.trim() !== ''
          }).each(function(){
            const txt = this.nodeValue
            if(re.test(txt)){
              const $parent = $(this).parent()
              const html = txt.replace(re,'<mark class="search-highlight">$1</mark>')
              $(this).replaceWith(html)
            }
          })

          // Highlight in code blocks specifically
          $section.find('pre code').each(function(){
            const $code = $(this)
            let html = $code.html()
            if(re.test(html)){
              html = html.replace(re,'<mark class="search-highlight">$1</mark>')
              $code.html(html)
            }
          })
        })

        // Collect all marks in this section
        $section.find('mark.search-highlight').each(function(){
          foundMarks.push($(this))
        })
      } else {
        $section.hide()
      }
    })

    // Update search results to individual marks
    searchResults = foundMarks
    currentResultIndex = 0

    // Update search results info and navigation
    updateSearchInfo(foundMarks.length, term)
    updateNavigation()
    activateMobileNavigation()

    // Navigate to first mark and center it
    if(foundMarks.length > 0) {
      navigateToResult(0)
    }
  }

  function updateSearchInfo(count, term) {
    // Remove existing search info
    $('.search-info').remove()
    
    if(term && term.length > 0) {
      const infoText = count > 0 ? 
        `נמצאו ${count} התאמות עבור "${term}"` : 
        `לא נמצאו תוצאות עבור "${term}"`
      
      const $info = $('<div class="search-info">' + infoText + '</div>')
      $('.search-navigation').before($info)
    }
  }

  function updateNavigation() {
    const $nav = $('.search-navigation')
    const $counter = $('#result-counter')
    const $prevBtn = $('#prev-result')
    const $nextBtn = $('#next-result')

    if(searchResults.length > 1) {
      $nav.show()
      $counter.text(`${currentResultIndex + 1} / ${searchResults.length}`)
      
      // Update button states
      $prevBtn.prop('disabled', currentResultIndex === 0)
      $nextBtn.prop('disabled', currentResultIndex === searchResults.length - 1)
    } else if(searchResults.length === 1) {
      $nav.show()
      $counter.text('1 / 1')
      $prevBtn.prop('disabled', true)
      $nextBtn.prop('disabled', true)
    } else {
      $nav.hide()
    }
  }

  function activateMobileNavigation() {
    if(window.innerWidth <= 640 && searchResults.length > 0) {
      $('.search-navigation').addClass('mobile-fixed')
      // Close sidebar if open
      $('#sidebar').removeClass('open')
      $('.sidebar-overlay').removeClass('active')
      $('body').removeClass('sidebar-open')
    }
  }

  function deactivateMobileNavigation() {
    $('.search-navigation').removeClass('mobile-fixed')
  }

  function navigateToResult(index) {
    if(index < 0 || index >= searchResults.length) return

    // Remove current highlight
    $('mark.search-highlight').removeClass('current-mark')
    
    // Set new current result
    currentResultIndex = index
    const $currentMark = searchResults[currentResultIndex]
    $currentMark.addClass('current-mark')
    
    // Calculate position to center the mark on screen
    const markTop = $currentMark.offset().top
    const markHeight = $currentMark.outerHeight()
    const viewportHeight = $(window).height()
    const centerOffset = (viewportHeight / 2) - (markHeight / 2)
    let scrollPosition = markTop - centerOffset
    
    // Ensure we don't scroll beyond the document bounds
    const documentHeight = $(document).height()
    const maxScroll = Math.max(0, documentHeight - viewportHeight)
    
    // Add some padding to prevent edge cases
    const topPadding = 100
    const bottomPadding = 100
    
    scrollPosition = Math.max(topPadding, Math.min(scrollPosition, maxScroll - bottomPadding))
    
    // Scroll to center the mark with smooth animation
    $('html,body').animate({
      scrollTop: scrollPosition
    }, 400, 'swing')

    updateNavigation()
  }

  // Navigation button events
  $('#prev-result').on('click', function() {
    if(currentResultIndex > 0) {
      navigateToResult(currentResultIndex - 1)
    }
  })

  $('#next-result').on('click', function() {
    if(currentResultIndex < searchResults.length - 1) {
      navigateToResult(currentResultIndex + 1)
    }
  })

  // Close search navigation
  $('#close-search').on('click', function() {
    deactivateMobileNavigation()
    clearMarks()
    $search.val('')
    $('.search-info').remove()
    $('.search-navigation').hide()
  })

  // Auto-activate mobile navigation when using nav buttons
  $('.nav-btn').on('click', function() {
    if(window.innerWidth <= 640) {
      activateMobileNavigation()
    }
  })

  // Handle window resize
  $(window).on('resize', function() {
    if(window.innerWidth > 640) {
      deactivateMobileNavigation()
    } else if(searchResults.length > 0 && $('.search-navigation').is(':visible')) {
      activateMobileNavigation()
    }
  })

  // Keyboard navigation
  $(document).on('keydown', function(e) {
    if($('.search-navigation').is(':visible')) {
      if(e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        $('#next-result').click()
      } else if(e.key === 'ArrowUp') {
        e.preventDefault()
        $('#prev-result').click()
      }
    }
  })

  let searchTimer = null
  $search.on('input', function(){
    clearTimeout(searchTimer)
    const term = $(this).val().trim()
    clearMarks()
    
    if(term.length < 1) {
      $('.section').show()
      $('.search-info').remove()
      $('.search-navigation').hide()
      return
    }
    
    searchTimer = setTimeout(() => searchAndFilter(term), 300)
  })

  // Syntax highlighting disabled to prevent display issues
  function highlightCode(){
    // Reset all highlighted code blocks to original state
    $('pre code.highlighted').each(function(){
      const $c = $(this)
      $c.removeClass('highlighted')
      // Remove any existing highlighting spans and restore clean text
      const cleanText = $c.text()
      $c.html(cleanText)
    })
    return
  }
  highlightCode()

  // Ensure all text directions are correct
  function ensureDirections(){
    // All Hebrew text should be RTL
    $('.section h2, .section h3, .section p, .section li, .section dt, .section dd').attr('dir','rtl')
    // All code blocks should be LTR
    $('pre code, .code-header').attr('dir','ltr')
    // Playground should be LTR
    $('#play-area, #filename').attr('dir','ltr')
  }
  ensureDirections()
  
  // Close sidebar when clicking nav item on mobile
  $('.toc a').click(function(){
    if(window.innerWidth <= 900){
      setTimeout(function(){
        $('#sidebar').removeClass('open')
        $('.sidebar-overlay').removeClass('active')
        $('body').removeClass('sidebar-open')
      }, 200)
    }
  })

  $('#save_pdf').click(async function(){
    // Logic to save the content as PDF
    $('#sidebar, #search, .header-buttons, .copy-btn, #save_pdf, #menu-toggle').toggle();
    $('#show-solutions').click(); // Hide solutions if visible
    $('#show-solutions').toggle()
    // print the page
    await window.print();
    // $('#sidebar, #search, .header-buttons, .copy-btn, #save_pdf, #menu-toggle').toggle();
  })
})