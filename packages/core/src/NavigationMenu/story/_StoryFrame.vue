<template>
  <div class="w-screen h-screen bg-gray-200">
    <div>
      <div
        class="flex relative items-center px-4 py-3 justify-between w-full bg-green8 shadow-xl"
      >
        <button>Logo</button>

        <slot />

        <button>Login</button>
      </div>
      <div class="max-w-[800px] m-auto pt-5 px-4">
        <h2>Test page content</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam purus
          odio, vestibulum in dictum et,
          <a href="#example">sagittis vel nibh</a>. Fusce placerat arcu lorem, a
          scelerisque odio fringilla sit amet. Suspendisse volutpat sed diam ut
          cursus. Nulla facilities. Ut at volutpat nibh. Nullam justo mi,
          elementum vitae ex eu,{' '}
          <a href="#example">gravida dictum metus</a>. Morbi vulputate
          consectetur cursus. Fusce vitae nisi nunc. Suspendisse pellentesque
          aliquet tincidunt. Aenean molestie pulvinar ipsum.
        </p>

        <button>Button</button>
      </div>
    </div>
  </div>
</template>
