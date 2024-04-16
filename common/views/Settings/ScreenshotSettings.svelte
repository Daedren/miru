<script>
  import IPC from '@/modules/ipc.js'
  import SettingCard from './SettingCard.svelte'

  import { click } from '@/modules/click.js'
  import { defaults } from '@/modules/util.js'
  import { ScreenshotLocations, ScreenshotLocation } from '@/modules/util.js'
  export let settings

  function handleFolder () {
    IPC.emit('dialog', 'screenshotFilesystemPath')
  }
</script>

<h4 class='mb-10 font-weight-bold'>Screenshot Settings</h4>
<SettingCard title='Screenshot Capture Type' description='What to do with screenshots?'>
    <select class='form-control bg-dark w-300 mw-full' bind:value={settings.screenshotLocation}>
        <!-- selected={location == settings.screenshotLocation} -->
        {#each ScreenshotLocations as location}
            <option value="{location}">{location}</option>
        {/each}
    </select>
</SettingCard>
{#if settings.screenshotLocation === ScreenshotLocation.Filesystem}
<SettingCard title='Screenshot Download Location' description='Path to the folder used to store screenshots.'>
    <div
        class='input-group w-300 mw-full'>
        <div class='input-group-prepend'>
        <button type='button' use:click={handleFolder} class='btn btn-primary input-group-append'>Select Folder</button>
        </div>
        <input type='url' class='form-control bg-dark' readonly value={settings.screenshotFilesystemPath} placeholder='/tmp' />
    </div>
</SettingCard>
<SettingCard title='Screenshot Filepath Format' description={'What format for the filenames, you can use backslashes to directories with placeholders. \nPlaceholders supported:\n%F: Current video filename\n%n: An incrementing number from 0001\n%m: Month\n%Y: Year\n%d: Day\n%H: Hours\n%M: Minutes\n%S: Seconds'}>
    <input class='form-control bg-dark w-300 mw-full' bind:value={settings.screenshotFilesystemTemplate} placeholder={defaults.screenshotFilesystemTemplate} />
</SettingCard>
{/if}