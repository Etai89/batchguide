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

  // simple search and highlight
  function clearMarks(){
    $('.section').each(function(){
      const $s=$(this)
      $s.find('mark').each(function(){
        const $m=$(this)
        $m.replaceWith($m.text())
      })
    })
  }
  function markText(term){
    if(!term) return
    const re=new RegExp('('+term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig')
    $('.section').each(function(){
      const $s=$(this)
      $s.contents().filter(function(){
        return this.nodeType===3
      }).each(function(){
        const txt=this.nodeValue
        if(re.test(txt)){
          const html=txt.replace(re,'<mark>$1</mark>')
          $(this).replaceWith(html)
        }
      })

      // also search inside code blocks
      $s.find('pre code').each(function(){
        const $c=$(this)
        const html=$c.html()
        if(re.test(html)){
          $c.html(html.replace(re,'<mark>$1</mark>'))
        }
      })

      if($s.find('mark').length){
        $('html,body').animate({scrollTop:$s.offset().top-20},250)
      }
    })
  }

  let searchTimer=null
  $search.on('input',function(){
    clearTimeout(searchTimer)
    const term=$(this).val().trim()
    clearMarks()
    if(term.length<1) return
    searchTimer=setTimeout(()=>markText(term),250)
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
})